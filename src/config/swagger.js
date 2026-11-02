import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import YAML from "yaml";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const specificationPath = path.resolve(currentDirectory, "../../docs/openapi.yaml");

export const openApiSpecification = YAML.parse(readFileSync(specificationPath, "utf8"));
