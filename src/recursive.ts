import fs from "fs";
import path from "path";

import { promises as fsPromises, PathLike, Dirent } from "fs";

/**
 * Recursively read all files in a directory.
 * @param {fs.PathLike} dirPath The path to the directory that will be recursively traversed.
 * @param {Array} arrayOfFiles The array that all files will be recursively pushed to.
 * @returns Returns an array of files.
 */

export function getAllFiles(dirPath: string): string[] {
  const files = fs.readdirSync(dirPath);

  let arrayOfFiles: string[] = [];
  files.forEach(function (file: string) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles.push(...getAllFiles(dirPath + "/" + file));
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

export async function getRecursiveFilePaths(path: PathLike, recursive = true): Promise<string[]> {
  let files: string[] = [];
  const items: Dirent[] = await fsPromises.readdir(path, { withFileTypes: true });
  if (!items) throw new Error(`No items in ${path}`);
  for (let i = 0, m = items.length; i < m; ++i) {
    if (items[i].isDirectory()) {
      files = [...files, ...(await getRecursiveFilePaths(`${path}/${items[i].name}`))]
    } else if (items[i].isFile()) {
      files.push(`${path}/${items[i].name}`)
    }
  }
  return files;
}
