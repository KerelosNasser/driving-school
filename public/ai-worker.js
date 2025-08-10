import { pipeline, env } from '@xenova/transformers';

// Skip local model check - use HuggingFace models
env.allowLocalModels = false;

// Use the Singleton pattern to enable lazy construction of the pipeline
class PipelineSingleton {
  static task = 'text-generation';
  static model = 'Xenova/distilgpt2';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  try {
    // Retrieve the text-generation pipeline
    let generator = await PipelineSingleton.getInstance(x => {
      // Send progress updates back to the main thread
      self.postMessage(x);
    });

    // Generate text based on the input
    let output = await generator(event.data.text, {
      max_new_tokens: 50,
      do_sample: true,
      temperature: 0.7,
    });

    // Send the result back to the main thread
    self.postMessage({
      status: 'complete',
      output: output,
    });
  } catch (error) {
    self.postMessage({
      status: 'error',
      error: error.message,
    });
  }
});