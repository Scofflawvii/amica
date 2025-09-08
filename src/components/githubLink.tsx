import { buildUrl } from "@/utils/buildUrl";
import Image from "next/image";

export const GitHubLink = () => {
  return (
    <a
      draggable={false}
      href="https://github.com/semperai/amica"
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="py-2 px-2 rounded-lg bg-[#1F2328] hover:bg-[#33383E] active:bg-[565A60] inline-flex">
        <Image
          alt="https://github.com/semperai/amica"
          height={24}
          width={24}
          src={buildUrl("/github-mark-white.svg")}
        />
        <div className="mx-2 text-white font-bold">Open Source</div>
      </div>
    </a>
  );
};
