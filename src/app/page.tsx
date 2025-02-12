import AudioRecorder from "@/components/AudioRecorder";
import Experience from "@/components/Experience";
import SimpleInput from "@/components/SimpleInput";
// import SimpleInput from "@/components/SimpleInput";

export default function Home() {
  return (
    <>
      <Experience />
      <div className="absolute left-0 top-0 flex min-h-screen w-screen items-end justify-center gap-5 p-24">
        <div className="flex items-center gap-5">
          <SimpleInput />
          <AudioRecorder />
        </div>
      </div>
    </>
  );
}
