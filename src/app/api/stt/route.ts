import { NextResponse } from "next/server";
import OpenAI from "openai";

import logger from "@/lib/logger";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const audio = formData.get("audio") as File;
  const messages = JSON.parse(formData.get("messages") as string);

  try {
    const transcription = await client.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
    });

    logger.info(JSON.stringify(transcription, null, 2));
    logger.info(JSON.stringify(messages, null, 2));

    // Return the transcription data as JSON
    return NextResponse.json(transcription.text);
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json({ error: "Transcription failed." }, { status: 500 });
  }
}
