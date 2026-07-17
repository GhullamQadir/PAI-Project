import os
import asyncio
import ffmpeg
from app.config import settings

def get_video_metadata(file_path: str) -> dict:
    """Extract metadata using ffprobe."""
    try:
        probe = ffmpeg.probe(file_path, cmd=settings.FFPROBE_PATH)
        video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
        
        if not video_stream:
            return {}

        return {
            "duration": float(probe['format'].get('duration', 0)),
            "width": int(video_stream.get('width', 0)),
            "height": int(video_stream.get('height', 0)),
            "fps": eval(video_stream.get('r_frame_rate', '0/1')),
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
