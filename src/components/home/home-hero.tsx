"use client";
import Image from "next/image";
import coverImage from "@/cover.jpg";

export function HomeHero() {
  return (
    <section className="relative min-h-[760px] overflow-hidden bg-[#090909] pt-[72px] text-white">
      <div className="relative mx-auto w-full max-w-[1280px] p-4">
        <Image
          src={coverImage}
          alt="描述图片内容"
          className="object-cover h-auto w-full origin-bottom rounded-t-[22px] transform-gpu transition duration-300 will-change-transform hover:scale-[1.015]"
          priority
        />
      </div>
    </section>
  );
}
