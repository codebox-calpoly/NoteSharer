"use client";

import { useEffect, useState } from "react";
import { DesignNav } from "@/app/components/DesignNav";

export default function LeaderboardPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("all-time");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const leaderboardData = [
    { rank: 1, name: "Sarah Johnson", uploads: 156, credits: 2340, avatar: "SJ" },
    { rank: 2, name: "Michael Chen", uploads: 142, credits: 2130, avatar: "MC" },
    { rank: 3, name: "Emily Davis", uploads: 128, credits: 1920, avatar: "ED" },
    { rank: 4, name: "James Wilson", uploads: 115, credits: 1725, avatar: "JW" },
    { rank: 5, name: "Jessica Brown", uploads: 98, credits: 1470, avatar: "JB" },
    { rank: 6, name: "David Martinez", uploads: 87, credits: 1305, avatar: "DM" },
    { rank: 7, name: "Ashley Taylor", uploads: 76, credits: 1140, avatar: "AT" },
    { rank: 8, name: "Christopher Lee", uploads: 65, credits: 975, avatar: "CL" },
  ];

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-yellow-600";
    if (rank === 2) return "from-gray-300 to-gray-500";
    if (rank === 3) return "from-orange-400 to-orange-600";
    return "from-[#6dbe8b] to-[#90bf8e]";
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f7]" style={{ fontFamily: "var(--font-inter), Inter, Helvetica, sans-serif" }}>
      <DesignNav active="leaderboard" />
      <main className="flex-1 px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div
            className={`mb-8 text-center transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="font-bold text-[#2e2e2e] text-3xl md:text-4xl mb-2">Leaderboard</h2>
            <p className="font-normal text-[#666666] text-base md:text-lg">Top contributors in the community</p>
          </div>
          <div
            className={`mb-8 flex justify-center transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex gap-2 bg-white rounded-lg p-1 shadow-md">
              {["all-time", "month", "week"].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-6 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                    selectedPeriod === period ? "bg-[#6dbe8b] text-white" : "text-[#666666] hover:text-[#6dbe8b]"
                  }`}
                >
                  {period === "all-time" ? "All Time" : period === "month" ? "This Month" : "This Week"}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`mb-12 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex items-end justify-center gap-4 md:gap-8">
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${getMedalColor(2)} flex items-center justify-center text-white text-xl md:text-2xl font-bold mb-3 shadow-lg`}>
                  {leaderboardData[1].avatar}
                </div>
                <div className="bg-white rounded-t-xl p-4 md:p-6 text-center shadow-lg w-32 md:w-40 h-32 md:h-40 flex flex-col justify-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-400 mb-2">2</div>
                  <p className="font-semibold text-[#2e2e2e] text-sm md:text-base mb-1">{leaderboardData[1].name.split(" ")[0]}</p>
                  <p className="text-[#6dbe8b] text-xs md:text-sm font-bold">{leaderboardData[1].credits} pts</p>
                </div>
              </div>
              <div className="flex flex-col items-center -mt-8">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${getMedalColor(1)} flex items-center justify-center text-white text-2xl md:text-3xl font-bold mb-3 shadow-xl`}>
                  {leaderboardData[0].avatar}
                </div>
                <div className="bg-white rounded-t-xl p-4 md:p-6 text-center shadow-xl w-32 md:w-40 h-40 md:h-48 flex flex-col justify-center">
                  <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">1</div>
                  <p className="font-semibold text-[#2e2e2e] text-sm md:text-base mb-1">{leaderboardData[0].name.split(" ")[0]}</p>
                  <p className="text-[#6dbe8b] text-xs md:text-sm font-bold">{leaderboardData[0].credits} pts</p>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${getMedalColor(3)} flex items-center justify-center text-white text-xl md:text-2xl font-bold mb-3 shadow-lg`}>
                  {leaderboardData[2].avatar}
                </div>
                <div className="bg-white rounded-t-xl p-4 md:p-6 text-center shadow-lg w-32 md:w-40 h-28 md:h-32 flex flex-col justify-center">
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">3</div>
                  <p className="font-semibold text-[#2e2e2e] text-sm md:text-base mb-1">{leaderboardData[2].name.split(" ")[0]}</p>
                  <p className="text-[#6dbe8b] text-xs md:text-sm font-bold">{leaderboardData[2].credits} pts</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {leaderboardData.slice(3).map((user, index) => (
              <div
                key={user.rank}
                className={`bg-white rounded-xl shadow-md p-4 md:p-6 transition-all duration-700 hover:shadow-lg hover:-translate-y-1 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${(index + 4) * 100}ms` }}
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="font-bold text-[#666666] text-xl md:text-2xl w-8 text-center">{user.rank}</div>
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${getMedalColor(user.rank)} flex items-center justify-center text-white text-base md:text-lg font-bold`}>
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2e2e2e] text-base md:text-lg">{user.name}</h3>
                    <p className="text-[#666666] text-sm">{user.uploads} uploads</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#6dbe8b] text-lg md:text-xl">{user.credits}</div>
                    <div className="text-[#666666] text-xs">points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
