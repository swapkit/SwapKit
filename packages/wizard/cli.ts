#!/usr/bin/env node

import { swapkitWizard } from "./src";
import { handleCancel } from "./src/helpers";

swapkitWizard().catch(handleCancel);
