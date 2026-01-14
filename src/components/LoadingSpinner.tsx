export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full animate-ping opacity-25"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-black dark:border-t-slate-800 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

