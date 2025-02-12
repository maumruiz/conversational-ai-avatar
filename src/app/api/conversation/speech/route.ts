// import { PassThrough } from "stream";

import { PassThrough } from "stream";

import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Messages } from "@langchain/langgraph";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import OpenAI from "openai";

import { graph } from "@/lib/graph";
import logger from "@/lib/logger";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.SPEECH_KEY || "",
  process.env.SPEECH_REGION || ""
);
speechConfig.speechSynthesisVoiceName = "en-US-BrianMultilingualNeural";

// Allow streaming responses up to 30 seconds
// export const maxDuration = 30;

// Define POST method for chat route
export async function POST(req: Request) {
  const formData = await req.formData();
  const audio = formData.get("audio") as File;
  const messages = JSON.parse(formData.get("messages") as string);
  logger.info(JSON.stringify(messages, null, 2));

  //* Speech to text
  const transcription = await client.audio.transcriptions.create({
    file: audio,
    model: "whisper-1",
  });
  logger.info(JSON.stringify(transcription, null, 2));
  // create new message with transcription
  const userMessage = {
    role: "user",
    content: transcription.text,
    id: Date.now().toString(),
  };
  const updatedMessages = [...messages, userMessage];

  //* Text to text
  const allMessages: Messages = updatedMessages.map((message) =>
    message.role === "user" ? new HumanMessage(message.content) : new AIMessage(message.content)
  );
  // Stream of messages
  const result = await graph.invoke({ messages: allMessages });
  const lastMessage = result.messages[result.messages.length - 1];

  //* Text to speech (and visemes)
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

  //* Return processed response
  logger.info(`Response: ${lastMessage.content}`);
  const safeLastMessageContent = lastMessage.content
    .toString()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2014/g, "-");
  return new Response(audioStream, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `inline; filename=tts.mp3`,
      Visemes: JSON.stringify(visemes),
      Result: JSON.stringify({
        id: lastMessage.id,
        role: "assistant",
        content: safeLastMessageContent,
      }),
      UserMessage: JSON.stringify(userMessage),
    },
  });
}
