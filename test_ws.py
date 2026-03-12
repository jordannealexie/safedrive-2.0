import asyncio
import websockets
import json

async def test():
    try:
        ws = await websockets.connect('ws://100.69.59.30:8000/ws/live', open_timeout=5)
        msg = await asyncio.wait_for(ws.recv(), timeout=5)
        d = json.loads(msg)
        print("WS OK - timestamp:", d.get("timestamp"))
        print("Moving:", d.get("is_moving"))
        await ws.close()
    except Exception as e:
        print("WS Error:", e)

asyncio.run(test())
