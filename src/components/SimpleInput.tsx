"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SendIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useConversation } from "@/lib/store";

const formSchema = z.object({
  message: z.string().min(2).max(50),
});

interface MessageType {
  id: string;
  role: string;
  content: string;
}

export default function SimpleInput() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [messages, setMessages] = useState<MessageType[]>([]);
  const messages = useConversation((state) => state.messages);
  const addMessage = useConversation((state) => state.addMessage);
  const setMessageResult = useConversation((state) => state.setMessageResult);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    const userMessage = {
      role: "user",
      content: values.message,
      id: Date.now().toString(),
    };
    addMessage(userMessage);
    const updatedMessages: MessageType[] = [...messages, userMessage];

    const response = await fetch("/api/conversation/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updatedMessages }),
    });

    const message = JSON.parse((await response.headers.get("message")) || "{}");
    if (Object.keys(message).length === 0) {
      console.error("No message returned from server");
      setIsSubmitting(false);
      return;
    }

    console.log(message);
    const audio = await response.blob();
    const visemes = JSON.parse((await response.headers.get("visemes")) || "[]");
    const audioUrl = URL.createObjectURL(audio);
    const audioPlayer = new Audio(audioUrl);
    setMessageResult({
      visemes,
      audioPlayer,
    });
    audioPlayer.onended = () => {
      setMessageResult(null);
    };
    audioPlayer.currentTime = 0;
    audioPlayer.play();
    console.log(visemes);
    addMessage(message);

    toast(
      <div className="flex flex-col space-y-2">
        <pre className="mt-2 w-[320px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
        <pre className="mt-2 w-[320px] rounded-md bg-gray-200 p-4">
          <code className="text-black">{JSON.stringify(message, null, 2)}</code>
        </pre>
      </div>
    );
    form.reset(); // This will clear the input
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-80 items-center space-x-2">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="grow">
              {/* <FormLabel>Message</FormLabel> */}
              <FormControl>
                <Input placeholder="Talk to me..." {...field} disabled={isSubmitting} />
              </FormControl>
              {/* <FormDescription>This is your public display name.</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          <SendIcon strokeWidth={3} />
        </Button>
      </form>
    </Form>
  );
}
