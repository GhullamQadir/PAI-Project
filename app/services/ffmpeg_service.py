import os
import asyncio
import ffmpeg
from fractions import Fraction
from app.config import settings

def get_video_metadata(file_path: str) -> dict:
    """Extract metadata using ffprobe."""
    try:
        probe = ffmpeg.probe(file_path, cmd=settings.FFPROBE_PATH)
        video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
        
        if not video_stream:
            return {}

        # Safe FPS parsing (avoid eval for security)
        fps_str = video_stream.get('r_frame_rate', '0/1')
        try:
            fps = float(Fraction(fps_str))
        except (ValueError, ZeroDivisionError):
            fps = 0.0

        return {
            "duration": float(probe['format'].get('duration', 0)),
            "width": int(video_stream.get('width', 0)),
            "height": int(video_stream.get('height', 0)),
            "fps": fps,
            "codec": video_stream.get('codec_name', ''),
            "bitrate": int(probe['format'].get('bit_rate', 0))
        }
    except ffmpeg.Error as e:
        print(f"FFprobe error: {e.stderr.decode() if e.stderr else str(e)}")
        return {}

async def trim_video(input_path: str, output_path: str, start_time: float, end_time: float) -> str:
    """Trim a video asynchronously."""
    duration = end_time - start_time
    try:
        process = (
            ffmpeg
            .input(input_path, ss=start_time, t=duration)
            .output(output_path, c="copy")
            .overwrite_output()
            .run_async(cmd=settings.FFMPEG_PATH, pipe_stdout=True, pipe_stderr=True)
        )
        out, err = await asyncio.to_thread(process.communicate)
        if process.returncode != 0:
            raise Exception(f"FFmpeg error: {err.decode()}")
        return output_path
    except Exception as e:
        raise Exception(f"Failed to trim video: {str(e)}")

import re

async def detect_silence(input_path: str, threshold_db: int = -30, duration: float = 0.5) -> list[dict]:
    """Detect silent parts in a video."""
    try:
        process = (
            ffmpeg
            .input(input_path)
            .filter('silencedetect', n=f'{threshold_db}dB', d=duration)
            .output('null', f='null')
            .run_async(cmd=settings.FFMPEG_PATH, pipe_stdout=True, pipe_stderr=True)
        )
        out, err = await asyncio.to_thread(process.communicate)
        err_str = err.decode()
        
        silences = []
        current_start = None
        
        for line in err_str.split('\n'):
            if 'silence_start:' in line:
                match = re.search(r'silence_start:\s*([\d\.]+)', line)
                if match:
                    current_start = float(match.group(1))
            elif 'silence_end:' in line:
                match = re.search(r'silence_end:\s*([\d\.]+)', line)
                if match and current_start is not None:
                    silences.append({
                        "start": current_start,
                        "end": float(match.group(1))
                    })
                    current_start = None
                    
        return silences
    except Exception as e:
        raise Exception(f"Failed to detect silence: {str(e)}")

async def auto_trim_video(input_path: str, output_path: str, threshold_db: int = -30) -> str:
    """Trim initial and ending silence from video."""
    silences = await detect_silence(input_path, threshold_db)
    
    start_time = 0.0
    if silences and silences[0]['start'] < 1.0:
        start_time = silences[0]['end']
        
    metadata = get_video_metadata(input_path)
    end_time = metadata.get('duration', 0)
    
    if silences and end_time > 0:
        last_silence = silences[-1]
        if last_silence['end'] >= end_time - 1.0:
             end_time = last_silence['start']
             
    if start_time == 0.0 and (end_time == metadata.get('duration', 0) or end_time == 0):
        import shutil
        await asyncio.to_thread(shutil.copy, input_path, output_path)
        return output_path

    return await trim_video(input_path, output_path, start_time, end_time)

async def merge_videos(input_paths: list[str], output_path: str) -> str:
    """Merge multiple videos sequentially (assumes same format/resolution)."""
    # Write a concat file
    list_path = os.path.join(settings.TEMP_DIR, f"concat_list_{os.path.basename(output_path)}.txt")
    with open(list_path, "w") as f:
        for path in input_paths:
            # absolute path formatting for ffmpeg concat demuxer
            f.write(f"file '{os.path.abspath(path)}'\n")
    
    try:
        process = (
            ffmpeg
            .input(list_path, format='concat', safe=0)
            .output(output_path, c="copy")
            .overwrite_output()
            .run_async(cmd=settings.FFMPEG_PATH, pipe_stdout=True, pipe_stderr=True)
        )
        out, err = await asyncio.to_thread(process.communicate)
        if process.returncode != 0:
            raise Exception(f"FFmpeg error: {err.decode()}")
        return output_path
    except Exception as e:
        raise Exception(f"Failed to merge videos: {str(e)}")
    finally:
        if os.path.exists(list_path):
            os.remove(list_path)

async def extract_audio(input_path: str, output_path: str) -> str:
    """Extract audio from video as MP3 for whisper."""
    try:
        process = (
            ffmpeg
            .input(input_path)
            .output(output_path, acodec='libmp3lame', q=4)
            .overwrite_output()
            .run_async(cmd=settings.FFMPEG_PATH, pipe_stdout=True, pipe_stderr=True)
        )
        out, err = await asyncio.to_thread(process.communicate)
        if process.returncode != 0:
            raise Exception(f"FFmpeg error: {err.decode()}")
        return output_path
    except Exception as e:
         raise Exception(f"Failed to extract audio: {str(e)}")

async def burn_subtitles(video_path: str, subtitle_path: str, output_path: str) -> str:
    """Burn SRT subtitles into a video."""
    try:
        # Convert path to absolute and escape backslashes for FFmpeg subtitles filter
        # On Windows, path looks like C:\... which needs escaping like C\:/...
        # For simplicity, using forward slashes works well with ffmpeg on Windows
        sub_path_escaped = os.path.abspath(subtitle_path).replace("\\", "/")
        
        process = (
            ffmpeg
            .input(video_path)
            .output(output_path, vf=f"subtitles='{sub_path_escaped}'")
            .overwrite_output()
            .run_async(cmd=settings.FFMPEG_PATH, pipe_stdout=True, pipe_stderr=True)
        )
        out, err = await asyncio.to_thread(process.communicate)
        if process.returncode != 0:
            raise Exception(f"FFmpeg error: {err.decode()}")
        return output_path
    except Exception as e:
         raise Exception(f"Failed to burn subtitles: {str(e)}")
