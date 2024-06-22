import { Eta } from "https://deno.land/x/eta@v3.1.1/src/index.ts";
import { join, dirname } from "https://deno.land/std@0.207.0/path/mod.ts";
import { parse, stringify } from "https://deno.land/std@0.207.0/yaml/mod.ts";
import { FileError, StringArray } from "../types.ts";
import { copy } from "https://deno.land/std@0.181.0/fs/mod.ts";

// Debug function to log messages when DEBUG environment variable is set to 'true'
const debug = (...args: unknown[]): void => {
  if (Deno.env.get("DEBUG") === "true") {
    console.log(...args);
  }
};

// Check if a file or directory exists
export const exists = async (fileName: string): Promise<boolean> => {
  try {
    await Deno.stat(fileName);
    return true;
  } catch (_) {
    return false;
  }
};

// List all files in a folder and its subfolders
export const listFiles = async (folder: string): Promise<string[]> => {
  const files: string[] = [];
  for await (const entry of Deno.readDir(folder)) {
    const fullPath = join(folder, entry.name);
    if (entry.isFile) {
      files.push(fullPath);
    } else if (entry.isDirectory) {
      files.push(...await listFiles(fullPath));
    }
  }
  return files;
};

// Process a name by replacing placeholders with values from configData
const processName = (finalName: string, configData: Record<string, unknown>): string =>
  finalName.replace(/\[([^\]]+)\]/g, (_, varName: string) => String(configData[varName] ?? _));

// Get the relative file path between srcPath and srcFile
const getRelativeFilePath = (srcPath: string, srcFile: string): string => {
  const srcFileParts = srcFile.split(/\/|\\/).filter(p => p !== "" && p !== ".");
  const excludeParts = srcPath.split(/\/|\\/).filter(p => p !== "" && p !== ".");
  
  while (srcFileParts[0] === excludeParts[0]) {
    srcFileParts.shift();
    excludeParts.shift();
  }
  
  return srcFileParts.join("/");
};

// Fill template files with provided data
export const templateFill = async (fileNames: StringArray, payload: unknown): Promise<FileError[]> => {
  const failedFiles: FileError[] = [];
  const eta = new Eta({});

  for (const fileName of fileNames) {
    try {
      let fileContents = await Deno.readTextFile(fileName);
      fileContents = await eta.renderStringAsync(fileContents, payload as Record<string, unknown>);
      await Deno.writeTextFile(fileName, fileContents);
    } catch (e) {
      failedFiles.push({ file: fileName, error: e instanceof Error ? e : new Error(String(e)) });
    }
  }
  return failedFiles;
};

// Clone a template directory to a new location
export const cloneTemplate = async (
  srcPath: string,
  newBasePath: string,
  configData: Record<string, unknown> = {},
  templateData: Record<string, unknown> | undefined,
  excludeFiles: string[] = []
): Promise<FileError[]> => {
  debug('Inside cloneTemplate - srcPath:', srcPath);
  const srcFiles = await listFiles(srcPath);
  debug('srcFiles:', srcFiles);

  const cloneFailedFiles: FileError[] = [];
  const isExcluded = (filePath: string, exclusionPatterns: string[]): boolean => {
    return exclusionPatterns.some(pattern => {
      const regExp = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/'));
      return regExp.test(filePath);
    });
  };

  for (const srcFile of srcFiles) {
    debug('srcFile:', srcFile);
    const normalizedSrcFile = srcFile.replace(/\\/g, "/");
    debug('Normalized srcFile:', normalizedSrcFile);
    debug('Excluded files:', excludeFiles);

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

// Load a YAML file and parse its contents
export const loadConfig = async <T>(file: string): Promise<T | undefined> => {
  if (await exists(file)) {
    const content = await Deno.readTextFile(file);
    return parse(content) as T;
  }
  return undefined;
};

// Save config to a YAML file
const _saveConfig = async (folder: string, config: unknown): Promise<void> => {
  const filePath = join(folder, 'Switchfile');
  const yamlString = stringify(config);
  await Deno.writeTextFile(filePath, yamlString);
};

// Recursively copy files from source to destination
const _copyFiles = async (source: string, destination: string): Promise<void> => {
  await copy(source, destination, { overwrite: true });
};

// Recursively copy files from source to destination
const _recursiveCopyFiles = async (source: string, destination: string): Promise<void> => {
  await Deno.mkdir(destination, { recursive: true });
  for await (const entry of Deno.readDir(source)) {
    const srcPath = join(source, entry.name);
    const destPath = join(destination, entry.name);
    if (entry.isDirectory) {
      await _recursiveCopyFiles(srcPath, destPath);
    } else {
      await Deno.copyFile(srcPath, destPath);
    }
  }
};

// Format bytes to a human-readable string
const _formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

