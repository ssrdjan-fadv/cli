import { Eta } from "https://deno.land/x/eta@v3.1.1/src/index.ts";
import { join } from "https://deno.land/std@0.110.0/path/mod.ts";
import { parse } from "https://deno.land/std@0.202.0/yaml/mod.ts";
import { dirname } from "https://deno.land/std/path/mod.ts";
import {FileError, StringArray} from "../domain/types.ts";
import { $ as shell } from "https://deno.land/x/dax@0.35.0/mod.ts"

export const debug = (...args: unknown[]) => (process.env.DEBUG === 'true') ? console.log(...args) : null

export async function exists(fileName: string): Promise<boolean> {
  try {
    await Deno.lstat(fileName);
    return true;
  } catch (_) {
    return false;
  }
}

export async function listFiles(folder: string): Promise<string[]> {
  const files: string[] = [];
  for await (const dirEntry of Deno.readDir(folder)) {
    if (dirEntry.isFile) files.push(join(folder, dirEntry.name));
    if (dirEntry.isDirectory) files.push(...await listFiles(join(folder, dirEntry.name)));
  }
  return files;
}

// deno-lint-ignore no-explicit-any
export const processName = (finalName: string, configData: any) =>
  finalName.replace(/\[([^\]]+)\]/g,
    (match: string, varName: string): string => configData[varName] || match)

export const getRelativeFilePath = (srcPath: string, srcFile: string) => {
  const srcFileParts = srcFile.split(/\/|\\/).filter(p => p !== "" && p !== ".")
  const excludeParts = srcPath.split(/\/|\\/).filter(p => p !== "" && p !== ".")
  for (const excludePart of excludeParts) {
    for (const srcPart of srcFileParts) {
      if (excludePart === srcPart) {
        srcFileParts.shift()
      } else {
        break
      }
    }
  }
  return srcFileParts.join("/")
}

/*
 * Template Folder: ~/.switch-cli/templates/...
 * Project Folder: ~/my-project/....
 * Sample Template: ~/.switch-cli/templates/[template-name]/[template]-main.ts
 */
export const cloneTemplate = async (
  srcPath: string,
  newBasePath: string,
  configData: object = {},
  templateData: object | undefined,
  excludeFiles?: string[]
) => {
  debug('Inside cloneTemplate - srcPath:', srcPath);
  excludeFiles = excludeFiles || []; // Set to an empty array if undefined

  const srcFiles = await listFiles(srcPath);
  debug('srcFiles:', srcFiles);

  const cloneFailedFiles = [];
  const isExcluded = (filePath: string, exclusionPatterns: string[]): boolean => {
    return exclusionPatterns.some(pattern => {
      const regExp = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/'));
      return regExp.test(filePath);
    });
  };
  for (const srcFile of srcFiles) {
    debug('srcFile:', srcFile);
    // Normalize file paths to handle both forward and backward slashes
    const normalizedSrcFile = srcFile.split("\\").join("/");
    debug('Normalized srcFile:', normalizedSrcFile);
    debug('Excluded files:', excludeFiles);

    // Check if the current file should be excluded using custom function
    if (isExcluded(normalizedSrcFile, excludeFiles)) {
      debug(`Excluding file: ${srcFile}`);
      continue;
    }
    const relativeFilePath = getRelativeFilePath(srcPath, srcFile);
    debug('relativeFilePath:', relativeFilePath);
    const finalName = processName(`${newBasePath}/${relativeFilePath}`, configData);
    await Deno.mkdir(dirname(finalName), { recursive: true });
    await Deno.copyFile(srcFile, finalName);

    if (templateData) {
      const failedFiles = await templateFill([finalName], templateData);
      cloneFailedFiles.push(...failedFiles);
    }
  }

  return cloneFailedFiles;
};


export async function templateFill(fileNames: StringArray, payload: unknown): Promise<FileError[]> {
  const failedFiles: ({ file: string, error: Error })[] = [];
  const eta = new Eta({});
  for (const fileName of fileNames) {
    try {
      let fileContents = await Deno.readTextFile(fileName);
      fileContents = await eta.renderStringAsync(fileContents, payload as object);
      await Deno.writeTextFile(fileName, fileContents);
    } catch (e) {
      failedFiles.push({ file: fileName, error: e })
    }
  }
  return failedFiles
}

export async function loadYaml<T>(file: string): Promise<T> {
  let object!: T;
  const fileExists = await exists(file);
  if (fileExists) {
    const blob = await Deno.readTextFile(file);
    object = parse(blob) as T;
  }
  return object;
}

export const recursiveCopyFiles = async (source: string, destination: string) =>
  await shell`cp -r ${source} ${destination}`;

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

// export const downloadFile = async (url: string, destinationFile: string): Promise<boolean> => {
//   let downloaded = false;
//   try {
//     const pb = shell.progress("Downloading ");
//     await pb.with(async () => {
//       const res = await fetch(url);
//       const file = await Deno.open(destinationFile, { create: true, write: true })
//       await res.body?.pipeTo(file.writable);
//     });
//     pb.finish();
//     downloaded = true
//   } catch (e) {
//     downloaded = false
//     error(e)
//   } finally {
//     echo(`Done: ${downloaded}`)
//   }
//   return downloaded;
// }
