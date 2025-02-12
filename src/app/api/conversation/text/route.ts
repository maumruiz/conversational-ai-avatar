// import { PassThrough } from "stream";

import { PassThrough } from "stream";

import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Messages } from "@langchain/langgraph";
import { Message } from "ai";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import { graph } from "@/lib/graph";
import logger from "@/lib/logger";

const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.SPEECH_KEY || "",
  process.env.SPEECH_REGION || ""
);
speechConfig.speechSynthesisVoiceName = "en-US-BrianMultilingualNeural";

// Allow streaming responses up to 30 seconds
// export const maxDuration = 30;

// Define POST method for chat route
export async function POST(req: Request) {
  const {
    messages,
  }: {
    messages: Message[];
  } = await req.json();

  // TODO: Filter to only include last message when using langgraph memory
  const allMessages: Messages = messages.map((message) =>
    message.role === "user" ? new HumanMessage(message.content) : new AIMessage(message.content)
  );

  // Stream of messages
  const result = await graph.invoke({ messages: allMessages });
  const lastMessage = result.messages[result.messages.length - 1];

  // Use Microsoft Speech SDK to synthesize speech and get visemes
  const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
  const visemes: [number, number][] = [];
  speechSynthesizer.visemeReceived = function (s, e) {
    // logger.info(
    //   "(Viseme), Audio offset: " + e.audioOffset / 10000 + "ms. Viseme ID: " + e.visemeId
    // );
    visemes.push([e.audioOffset / 10000, e.visemeId]);
  };
  const audioStream = await new Promise((resolve, reject) => {
    speechSynthesizer.speakTextAsync(
      `${lastMessage.content}`,
      (result) => {
        const { audioData } = result;

        speechSynthesizer.close();

        // convert arrayBuffer to stream
        const bufferStream = new PassThrough();
        bufferStream.end(Buffer.from(audioData));
        resolve(bufferStream);
      },
      (error) => {
        logger.error(error);
        speechSynthesizer.close();
        reject(error);
      }
    );
  });

  logger.info(`Response: ${lastMessage.content}`);
  return new Response(audioStream, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `inline; filename=tts.mp3`,
      Visemes: JSON.stringify(visemes),
      Message: JSON.stringify({
        id: lastMessage.id,
        role: "assistant",
        content: lastMessage.content,
      }),
    },
  });
}
