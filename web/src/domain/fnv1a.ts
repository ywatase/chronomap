/** 32-bit FNV-1a over UTF-8 bytes; must match `chronomap_data.tile_builder.fnv1a32`. */
export function fnv1a32(text: string): number {
  let value = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) {
    value = Math.imul(value ^ byte, 0x01000193) >>> 0;
  }
  return value;
}
