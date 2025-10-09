import bunTailwind from "bun-plugin-tailwind";
import { buildPackage } from "../../tools/builder";

void buildPackage({ evmOnly: true, plugins: [bunTailwind] });
