import AVFoundation
import RaycastExtensionMacro


class MicrophoneRecorder: NSObject, AVCaptureAudioDataOutputSampleBufferDelegate {
    private var audioCaptureSession: AVCaptureSession?
    private var audioDataOutput: AVCaptureAudioDataOutput?
    private var audioWriter: AVAssetWriter?
    private var audioWriterInput: AVAssetWriterInput?
    private var isRecording = false

    override init() {
        super.init()
        setupAudioSession()
    }

    private func setupAudioSession() {
        audioCaptureSession = AVCaptureSession()

        guard let audioCaptureSession = audioCaptureSession else { return }

        do {
            let audioDevice = AVCaptureDevice.default(for: .audio)
            let audioInput = try AVCaptureDeviceInput(device: audioDevice!)
            
            if audioCaptureSession.canAddInput(audioInput) {
                audioCaptureSession.addInput(audioInput)
            }

            audioDataOutput = AVCaptureAudioDataOutput()
            if audioCaptureSession.canAddOutput(audioDataOutput!) {
                audioCaptureSession.addOutput(audioDataOutput!)
            }

            audioDataOutput?.setSampleBufferDelegate(self, queue: DispatchQueue.main)

            audioCaptureSession.startRunning()

            isRecording = true
            //print("Recording started")
        } catch {
            //print("Error setting up audio session: \(error.localizedDescription)")
        }
    }

    func stopRecording() {
        if isRecording {
            audioCaptureSession?.stopRunning()
            isRecording = false
            audioWriterInput?.markAsFinished()
            audioWriter?.finishWriting(completionHandler: {
                //print("Recording stopped")
            })
        }
    }

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard let audioWriterInput = audioWriterInput, audioWriter?.status == .writing else {
            setupAudioWriter(sampleBuffer)
            return
        }

        if audioWriterInput.isReadyForMoreMediaData {
            do {
                try audioWriterInput.append(sampleBuffer)
            } catch {
                //print("Error writing audio file: \(error.localizedDescription)")
            }
        }
    }

    private func setupAudioWriter(_ sampleBuffer: CMSampleBuffer) {
        guard let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return
        }

        let audioFilename = documentsDirectory.appendingPathComponent("recording.wav")

        do {
            let audioFormatDescription = CMSampleBufferGetFormatDescription(sampleBuffer)
            let audioSettings: [String: Any] = [
                AVFormatIDKey: kAudioFormatLinearPCM,
                AVSampleRateKey: 44100.0,
                AVNumberOfChannelsKey: 1,
                AVLinearPCMBitDepthKey: 16,
                AVLinearPCMIsFloatKey: false,
                AVLinearPCMIsBigEndianKey: false
            ]

            audioWriter = try AVAssetWriter(outputURL: audioFilename, fileType: .wav)
            audioWriterInput = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings, sourceFormatHint: audioFormatDescription)
            
            if audioWriter?.canAdd(audioWriterInput!) ?? false {
                audioWriter?.add(audioWriterInput!)
                audioWriter?.startWriting()
                audioWriter?.startSession(atSourceTime: CMSampleBufferGetPresentationTimeStamp(sampleBuffer))
            } else {
                //print("Error adding audio writer input.")
            }
        } catch {
            //print("Error setting up audio writer: \(error.localizedDescription)")
        }
    }
}







#exportFunction(recordMic)
func recordMic() async throws -> Int {
  //print("start recording")
  //return false
  //do {
    // Example usage:
    let audioRecorder = MicrophoneRecorder()
    //audioRecorder.startRecording();
    //try audioRecorder.setupAudioEngine()
    //audioRecorder.startRecording()
    usleep(UInt32(3000*1000))         // sleep 1 second before quitting
    // Record for some time...
    // Then stop recording:
    audioRecorder.stopRecording()
      //return 22
  /*} catch {
    return 1
      //print("error?")
  }*/
  //return 33

  //usleep(UInt32(1000*1000))         // sleep 1 second before quitting
  //stopRecording()
  //print("done")
  //exit(0)
  return 50
}

#handleFunctionCall()
