"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pcm16ToUlaw = pcm16ToUlaw;
exports.resampleTo8k = resampleTo8k;
const alawmulaw_1 = require("alawmulaw");
const wave_resampler_1 = require("wave-resampler");
/**
 * Converts PCM 16-bit buffer to u-law 8-bit buffer.
 */
function pcm16ToUlaw(pcm16Buffer) {
    // Create Int16Array view on the buffer
    const samples = new Int16Array(pcm16Buffer.buffer, pcm16Buffer.byteOffset, pcm16Buffer.length / 2);
    return Buffer.from(alawmulaw_1.mulaw.encode(samples));
}
/**
 * Resamples PCM 16-bit audio buffer from 16kHz to 8kHz.
 * Returns a Buffer containing the resampled data (PCM 16-bit).
 * @param pcm16Buffer Buffer containing 16-bit PCM at 16kHz
 */
function resampleTo8k(pcm16Buffer) {
    // 1. Create Int16Array view from the input Buffer
    const samples = new Int16Array(pcm16Buffer.buffer, pcm16Buffer.byteOffset, pcm16Buffer.length / 2);
    // 2. Resample from 16000Hz to 8000Hz
    // wave-resampler returns the new samples as valid numbers (Float64Array in implementation)
    const resampledData = (0, wave_resampler_1.resample)(samples, 16000, 8000);
    // 3. Convert back to Int16Array
    const resampledInt16 = new Int16Array(resampledData.length);
    for (let i = 0; i < resampledData.length; i++) {
        resampledInt16[i] = resampledData[i];
    }
    // 4. Return as Buffer
    return Buffer.from(resampledInt16.buffer);
}
