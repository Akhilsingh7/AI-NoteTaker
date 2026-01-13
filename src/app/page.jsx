import HomeLogin from "../component/HomeLogin";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Welcome to AI Smart Notes
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-8">
            Organize your notes and get AI-powered answers.
          </p>
          <HomeLogin></HomeLogin>
        </div>

        {/* Right Image/Illustration */}
        <div className="flex-1 flex justify-center">
          <div className="relative scale-75 sm:scale-90 lg:scale-100">
            {/* AI Character Illustration */}
            <div className="w-64 h-64 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full flex items-center justify-center relative">
              {/* Hard Hat */}
              <div className="absolute top-0 w-48 h-16 bg-yellow-400 rounded-t-full border-4 border-yellow-500"></div>

              {/* Face */}
              <div className="w-40 h-40 bg-yellow-300 rounded-full flex flex-col items-center justify-center relative z-10">
                {/* Glasses */}
                <div className="flex gap-2 mb-4">
                  <div className="w-12 h-12 bg-white rounded-full border-4 border-gray-800 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-900 rounded-full"></div>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-full border-4 border-gray-800 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-900 rounded-full"></div>
                  </div>
                </div>

                {/* Smile */}
                <div className="w-16 h-8 border-b-4 border-gray-800 rounded-b-full"></div>
              </div>

              {/* Arms */}
              <div className="absolute -left-8 top-32 w-20 h-3 bg-yellow-400 rounded-full transform -rotate-45"></div>
              <div className="absolute -right-8 top-32 w-20 h-3 bg-yellow-400 rounded-full transform rotate-45"></div>

              {/* Document Icon */}
              <div className="absolute -left-16 bottom-8 w-24 h-28 bg-white rounded-lg shadow-lg border-2 border-blue-600 p-2">
                <div className="space-y-1">
                  <div className="h-2 bg-blue-600 rounded w-full"></div>
                  <div className="h-2 bg-blue-400 rounded w-3/4"></div>
                  <div className="h-2 bg-blue-400 rounded w-5/6"></div>
                  <div className="h-2 bg-blue-400 rounded w-2/3"></div>
                </div>
              </div>

              {/* Circuit Lines */}
              <div className="absolute -right-12 top-20 w-16 h-1 bg-blue-600"></div>
              <div className="absolute -right-12 top-20 w-1 h-8 bg-blue-600"></div>
              <div className="absolute -right-12 bottom-24 w-16 h-1 bg-blue-600"></div>
              <div className="absolute -right-12 bottom-32 w-1 h-8 bg-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
