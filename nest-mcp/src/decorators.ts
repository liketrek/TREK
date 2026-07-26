import { addEntry, markController, type ClassRef } from './metadata';
import type { PromptOptions, ResourceOptions, ResourceTemplateOptions, ToolOptions } from './types';
import { Injectable } from '@nestjs/common';

/**
 * Marks a class as an MCP controller. Implies `@Injectable()` — register the
 * class in a module's `providers: []` and inject domain services through the
 * constructor as usual. Discovery scans ONLY marked classes (explicit opt-in,
 * deterministic registry).
 */
export function McpController(): ClassDecorator {
  return (target) => {
    Injectable()(target);
    markController(target as unknown as ClassRef);
  };
}

function mcpMethodDecorator(entry: (methodName: string) => Parameters<typeof addEntry>[1]): MethodDecorator {
  return (target, propertyKey) => {
    addEntry((target as { constructor: unknown }).constructor as ClassRef, entry(String(propertyKey)));
  };
}

/** Registers the method as an MCP tool. Handler signature: `(args, ctx)`. */
export function Tool(options: ToolOptions): MethodDecorator {
  return mcpMethodDecorator((methodName) => ({ kind: 'tool', methodName, options }));
}

/** Registers the method as a fixed-URI MCP resource. Handler signature: `(uri: URL, ctx)`. */
export function Resource(options: ResourceOptions): MethodDecorator {
  return mcpMethodDecorator((methodName) => ({ kind: 'resource', methodName, options }));
}

/** Registers the method as an MCP resource template. Handler signature: `(uri: URL, variables, ctx)`. */
export function ResourceTemplate(options: ResourceTemplateOptions): MethodDecorator {
  return mcpMethodDecorator((methodName) => ({ kind: 'resourceTemplate', methodName, options }));
}

/** Registers the method as an MCP prompt. Handler signature: `(args, ctx)`. */
export function Prompt(options: PromptOptions): MethodDecorator {
  return mcpMethodDecorator((methodName) => ({ kind: 'prompt', methodName, options }));
}
