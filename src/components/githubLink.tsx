import { buildUrl } from "@/utils/buildUrl";
import Image from "next/image";

export const GitHubLink = () => {
  return (
    <a
      draggable={false}
      href="https://github.com/semperai/amica"
      rel="noopener noreferrer"
      target="_blank">
      <div className="inline-flex rounded-lg bg-[hsl(var(--surface))] px-2 py-2 hover:bg-[hsl(var(--surface-alt))] active:bg-[hsl(var(--surface-alt))]">
        <Image
          alt="https://github.com/semperai/amica"
          height={24}
          width={24}
          src={buildUrl("/github-mark-white.svg")}
        />
        <div className="mx-2 font-bold text-white">Open Source</div>
      </div>
    </a>
  );
};
