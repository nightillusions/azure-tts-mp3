import { readdirSync, readFileSync, writeFileSync } from "fs";
import {
  SpeechSynthesisResult,
  ResultReason,
  AudioConfig,
  SpeechConfig,
  SpeechSynthesizer,
  SpeechSynthesisOutputFormat,
} from "microsoft-cognitiveservices-speech-sdk";

const { COGNITIVE_SERVICE_KEY } = process.env;
const SERVICE_REGION = "francecentral";
const TEXT_PATH = "./text/en";
const MP3_PATH = "./mp3/en";

type JsonText = {
  ssml: string;
};

class App {
  private audioConfig: AudioConfig | null = null;
  private speechConfig: SpeechConfig | null = null;
  private synthesizer: SpeechSynthesizer | null = null;

  private writeResult(fileName: string) {
    return (result: SpeechSynthesisResult) => {
      if (result.reason === ResultReason.SynthesizingAudioCompleted) {
        console.log("synthesis finished.");
        console.log(`Write file ${MP3_PATH}/${fileName}`);
        writeFileSync(
          `${MP3_PATH}/${fileName}`,
          Buffer.from(result.audioData),
          {}
        );
      } else {
        console.error(
          "Speech synthesis canceled, " +
            result.errorDetails +
            "\nDid you update the subscription info?"
        );
      }
      if (this.synthesizer) {
        this.synthesizer.close();
      }
    };
  }

  private handleError(err: any) {
    console.trace("err - " + err);
    if (this.synthesizer) {
      this.synthesizer.close();
    }
  }

  public run() {
    if (!COGNITIVE_SERVICE_KEY) {
      return;
    }

    // Recognizer.enableTelemetry(false);

    this.audioConfig = AudioConfig.fromAudioFileOutput("output.mp3");
    this.speechConfig = SpeechConfig.fromSubscription(
      COGNITIVE_SERVICE_KEY,
      SERVICE_REGION
    );
    this.speechConfig.speechSynthesisOutputFormat =
      SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
    this.synthesizer = new SpeechSynthesizer(
      this.speechConfig,
      this.audioConfig
    );

    const files = readdirSync(TEXT_PATH);

    console.log("########################################\n");
    console.log("###### Starting synthesize speech ######\n");
    console.log("########################################\n");

    files.forEach((fileName) => {
      if (!this.synthesizer) {
        return;
      }
      console.log(`Reading content from "${fileName}"...`);

      try {
        const fileRaw = readFileSync(`${TEXT_PATH}/${fileName}`);
        const { ssml } = JSON.parse(fileRaw.toString()) as JsonText;
        console.log("Synthesizing text", ssml);
        this.synthesizer.speakSsmlAsync(
          ssml,
          this.writeResult(fileName),
          this.handleError
        );
      } catch (error) {
        console.error(`Could not parse file (${fileName})`, error);
      }
    });
    console.log("########################################\n");
    console.log("###### Finished synthesize speech ######\n");
    console.log("########################################\n");
  }
}

const app = new App();
app.run();
