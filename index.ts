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
const SERVICE_REGION = "westeurope";
const TEXT_PATH = "./text/en";
const MP3_PATH = "./mp3/en";

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
    };
  }

  private synthesizeText(ssml: string): Promise<SpeechSynthesisResult> {
    return new Promise((resolve,  reject) => {
      if(!this.synthesizer) {
        reject("No synthesizer")
        return;
      }
      console.log("Synthesize", ssml);
      try {
        this.synthesizer.speakSsmlAsync(
          ssml,
          resolve,
          reject
        );
      } catch (error) {
        console.error(`Could not synthesize (${ssml})`, error);
        reject(error)
      }
    })
  }

  public async run() {
    if (!COGNITIVE_SERVICE_KEY) {
      return;
    }

    const fileFilter = process.argv[2];

    // throw new Error("hallo");

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

    console.log("########################################");
    console.log("###### Starting synthesize speech ######");
    console.log("########################################");


    for (const fileName of files) {
      if(fileFilter && !fileName.includes(fileFilter)) {
        continue;
      }
      const fileRaw = readFileSync(`${TEXT_PATH}/${fileName}`, {
        encoding: "utf-8",
      });
      const ssml = fileRaw.toString();
      const outputFilename = fileName.split(".")[0];
      const audioData = await this.synthesizeText(ssml)
      this.writeResult(`${outputFilename}.mp3`)(audioData)
    }

    console.log("########################################");
    console.log("###### Finished synthesize speech ######");
    console.log("########################################");

    this.close();
  }

  private close() {
    if (this.synthesizer) {
      this.synthesizer.close();
    }
  }
}

const app = new App();
app.run();
