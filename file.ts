import { promisify } from "util";
import { writeFile as nodeWriteFile } from "fs";

export const writeFile = promisify(nodeWriteFile);
