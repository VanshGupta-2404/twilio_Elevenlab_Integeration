import { mulaw } from 'alawmulaw';
import { resample } from 'wave-resampler';

/**
 * Converts PCM 16-bit buffer to u-law 8-bit buffer.
 */
export function pcm16ToUlaw(pcm16Buffer: Buffer): Buffer {
    // Create Int16Array view on the buffer
    const samples = new Int16Array(
        pcm16Buffer.buffer,
        pcm16Buffer.byteOffset,
        pcm16Buffer.length / 2
    );

    return Buffer.from(mulaw.encode(samples));
}

/**
 * Resamples PCM 16-bit audio buffer from 16kHz to 8kHz.
 * Returns a Buffer containing the resampled data (PCM 16-bit).
 * @param pcm16Buffer Buffer containing 16-bit PCM at 16kHz
 */
export function resampleTo8k(pcm16Buffer: Buffer): Buffer {
    // 1. Create Int16Array view from the input Buffer
    const samples = new Int16Array(
        pcm16Buffer.buffer,
        pcm16Buffer.byteOffset,
        pcm16Buffer.length / 2
    );

    // 2. Resample from 16000Hz to 8000Hz
    // wave-resampler returns the new samples as valid numbers (Float64Array in implementation)
    const resampledData = resample(samples, 16000, 8000);

    // 3. Convert back to Int16Array
    const resampledInt16 = new Int16Array(resampledData.length);
    for (let i = 0; i < resampledData.length; i++) {
        resampledInt16[i] = resampledData[i];
    }

    // 4. Return as Buffer
    return Buffer.from(resampledInt16.buffer);
}

/**
 * Decodes u-law 8kHz -> PCM 16-bit 16kHz
 */
export function ulawToPcm16_16k(ulawBuffer: Buffer): Buffer {
    // 1. Decode u-law (8-bit) -> PCM Int16 (16-bit) @ 8kHz
    // mulaw.decode returns Int16Array
    const pcm8k = mulaw.decode(new Uint8Array(ulawBuffer));

    // 2. Resample 8kHz -> 16kHz
    // wave-resampler takes ArrayLike, returns new samples (Float64Array in implementation)
    const resampledData = resample(pcm8k, 8000, 16000);

    // 3. Convert back to Int16Array
    const resampledInt16 = new Int16Array(resampledData.length);
    for (let i = 0; i < resampledData.length; i++) {
        resampledInt16[i] = resampledData[i];
    }

    // 4. Return as Buffer
    return Buffer.from(resampledInt16.buffer);
}
