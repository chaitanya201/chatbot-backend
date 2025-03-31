import { readFileSync } from "fs";

export const getAboutMeData = async () => {
  const aboutMeFilePath = `${process.cwd()}/src/db/about-me.txt`;

  const file = readFileSync(aboutMeFilePath, "utf-8");
  //   console.log("file", file);
  return file;
};
