"""
Voice-to-Text & Sarvam AI STT Pipeline Test Suite
Tests real-time Indic Speech-to-Text, key configuration, audio file uploading,
lexicon normalization, timeline extraction, and live Sarvam AI Translation & TTS services.
"""
import io
import json
import os
import sys

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app import config

client = TestClient(app)

def test_voice_status():
    res = client.get("/api/voice/status")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "ONLINE"
    assert data["model"] == "saaras:v3"
    assert len(data["supported_languages"]) >= 3
    assert data["sarvam_configured"] is True
    print("[PASS] TEST 1: Voice pipeline status endpoint healthy and reports saaras:v3 with active Sarvam key.")

def test_key_configuration():
    # Save original key
    original_key = config.SARVAM_API_KEY

    # Set a test subscription key
    res = client.post("/api/voice/configure-key", json={"api_key": "sarvam_test_sub_key_998811"})
    assert res.status_code == 200
    data = res.json()
    assert data["sarvam_configured"] is True
    assert "sarv...8811" in data["api_key_masked"]

    # Verify status reflects it
    status_res = client.get("/api/voice/status").json()
    assert status_res["sarvam_configured"] is True

    # Clear key to test fallback
    clear_res = client.post("/api/voice/configure-key", json={"api_key": ""}).json()
    assert clear_res["sarvam_configured"] is False

    # Restore original key
    client.post("/api/voice/configure-key", json={"api_key": original_key})
    assert client.get("/api/voice/status").json()["sarvam_configured"] is True
    print("[PASS] TEST 2: In-flight Sarvam AI API subscription key configuration, masking & restore verified.")

def test_synthetic_vernacular_presets():
    # Test Odia TC-01
    res_odia = client.post("/api/voice/transcribe", json={"language": "odia", "scenario_preset": "TC-01"}).json()
    assert "fever" in res_odia["translated_english"].lower()
    assert len(res_odia["extracted_symptoms"]) > 0
    assert len(res_odia["timeline"]) > 0

    # Test Hindi TC-02
    res_hindi = client.post("/api/voice/transcribe", json={"language": "hindi", "scenario_preset": "TC-02"}).json()
    assert "diarrhea" in res_hindi["translated_english"].lower() or "vomiting" in res_hindi["translated_english"].lower()
    print("[PASS] TEST 3: Vernacular presets (Odia & Hindi) correctly normalized with clinical timelines.")

def test_audio_file_upload_transcribe():
    # Generate standard RIFF WAV 16kHz mono audio
    sample_rate = 16000
    num_samples = sample_rate * 2  # 2 seconds
    byte_rate = sample_rate * 2
    block_align = 2
    wav_header = bytearray(b"RIFF")
    wav_header.extend((36 + num_samples * 2).to_bytes(4, "little"))
    wav_header.extend(b"WAVEfmt ")
    wav_header.extend((16).to_bytes(4, "little"))
    wav_header.extend((1).to_bytes(2, "little"))  # PCM
    wav_header.extend((1).to_bytes(2, "little"))  # Mono
    wav_header.extend(sample_rate.to_bytes(4, "little"))
    wav_header.extend(byte_rate.to_bytes(4, "little"))
    wav_header.extend(block_align.to_bytes(2, "little"))
    wav_header.extend((16).to_bytes(2, "little")) # 16 bits
    wav_header.extend(b"data")
    wav_header.extend((num_samples * 2).to_bytes(4, "little"))
    wav_header.extend(b"\x00" * (num_samples * 2))

    audio_bytes = bytes(wav_header)

    # Post to /api/voice/transcribe-audio
    files = {"file": ("test_patient_voice.wav", io.BytesIO(audio_bytes), "audio/wav")}
    data = {"language": "odia"}
    res = client.post("/api/voice/transcribe-audio", files=files, data=data)
    assert res.status_code == 200, f"Audio upload failed with {res.status_code}: {res.text}"
    result = res.json()
    assert "transcription" in result or "vernacular_script" in result
    assert "extracted_symptoms" in result
    assert "timeline" in result
    print(f"[PASS] TEST 4: Audio upload processed by Sarvam AI voice pipeline (Provider: {result.get('provider')}).")

def test_live_sarvam_connectivity():
    res = client.post("/api/voice/test-sarvam")
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True, f"Sarvam validation failed: {data}"
    services = data.get("services", {})
    assert services.get("translation", {}).get("status") == "HEALTHY"
    assert services.get("speech_to_text", {}).get("status") == "HEALTHY"
    assert services.get("text_to_speech", {}).get("status") == "HEALTHY"
    latency = services.get("translation", {}).get("latency_ms", "N/A")
    print(f"[PASS] TEST 5: Live Sarvam AI key verified across STT, Translation & TTS (Latency: {latency}ms).")

def test_live_sarvam_translation():
    res = client.post("/api/voice/translate", json={
        "text": "ରୋଗୀଙ୍କୁ ୩ ଦିନ ଧରି ଜ୍ୱର ଅଛି ଏବଂ ମୁଣ୍ଡ ବିନ୍ଧୁଛି",
        "source_language": "od-IN",
        "target_language": "en-IN"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    english = data.get("translated_text", "").lower()
    assert "fever" in english or "headache" in english
    print(f"[PASS] TEST 6: Live Sarvam Indic-to-English translation successful: '{data.get('translated_text')}'.")

def test_live_sarvam_tts():
    res = client.post("/api/voice/tts", json={
        "text": "ରୋଗୀଙ୍କୁ ତୁରନ୍ତ ଚିକିତ୍ସାଳୟକୁ ନିଅନ୍ତୁ",
        "language": "odia",
        "speaker": "aditya"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert len(data.get("audio_base64", "")) > 1000
    print(f"[PASS] TEST 7: Live Sarvam Text-to-Speech synthesized Indic audio ({len(data['audio_base64'])} bytes base64).")

def main():
    print("=" * 60)
    print("RUNNING AROGYA-TRIAGE VOICE-TO-TEXT & SARVAM AI TEST SUITE")
    print("=" * 60)
    test_voice_status()
    test_key_configuration()
    test_synthetic_vernacular_presets()
    test_audio_file_upload_transcribe()
    test_live_sarvam_connectivity()
    test_live_sarvam_translation()
    test_live_sarvam_tts()
    print("=" * 60)
    print("ALL 7 VOICE & SARVAM AI PIPELINE TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    main()
