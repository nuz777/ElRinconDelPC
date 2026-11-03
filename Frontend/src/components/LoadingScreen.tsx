import { motion } from "motion/react";

export default function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090b]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <h1 className="font-share text-3xl md:text-5xl text-zinc-100 tracking-wider">
          &lt; El sótano del pc /&gt;
        </h1>
        <div className="mt-6 flex items-center justify-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-zinc-200 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2.5 h-2.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2.5 h-2.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </motion.div>
  );
}
