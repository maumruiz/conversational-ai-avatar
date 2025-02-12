import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// Init llm model
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
});

// Define system prompt
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a conversational AI assistant that provides information about anything that the user wants. 
    Provide short answers to give a concise response to the user and go directly to the point.
    Don't provide long answers or give numbered or bulleted lists. Your answer should span from a single sentence to a single paragraph.
    Alwatys be polite and some times throw a joke if it is appropriate in the response.
    `,
  ],
  new MessagesPlaceholder("messages"),
]);

// Nodes
async function chatModelNode(state: typeof MessagesAnnotation.State) {
  const chain = prompt.pipe(llm);
  const response = await chain.invoke({
    messages: state.messages,
  });
  // logger.info(response);
  return { messages: [response] };
}

// Define the graph
const builder = new StateGraph(MessagesAnnotation)
  .addNode("agent", chatModelNode)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__");

export const graph = builder.compile();
