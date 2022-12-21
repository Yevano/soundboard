mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn normalize_audio(buffer: &mut [f32], target_level: f32, window_length: usize) {
    let rms = get_peak_rms(buffer, target_level, 0, buffer.len(), window_length);
    for i in 0 .. buffer.len() {
        buffer[i] *= rms;
    }
}

fn get_peak_rms(buffer: &[f32], target_level: f32, offset: usize, length: usize, mut window_length: usize) -> f32 {
    if window_length > length - offset {
        window_length = length - offset
    }

    let r = 10f32.powf(target_level / 10f32);

    let mut sum_squares = 0f32;

    for i in offset .. offset + window_length {
        sum_squares += buffer[i].powf(2f32);
    }

    let mut peak_sum_squares = sum_squares;

    for sliding_offset in offset + 1 .. length - window_length {
        sum_squares -= buffer[sliding_offset - 1].powf(2f32);
        sum_squares += buffer[sliding_offset + window_length].powf(2f32);

        if sum_squares > peak_sum_squares {
            peak_sum_squares = sum_squares
        }
    }

    ((window_length as f32 * r.powf(2f32)) / peak_sum_squares).sqrt()
}