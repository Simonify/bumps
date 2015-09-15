export default {
    "id": "demo",
    "name": "Example bump",
    "order": ["segment-1", "segment-2", "segment-pepe", "segment-3", "segment-4", "segment-5"],
    "segments": {
        "segment-1": {
            "id": "segment-1",
            "type": "TEXT",
            "duration": 2.1,
            "label": "Text 1",
            "text": "Welcome!"
        },
        "segment-2": {
            "id": "segment-2",
            "type": "TEXT",
            "duration": 1.2,
            "label": "Text 2",
            "text": "Thanks for trying out the TTN bump-maker!"
        },
        "segment-3": {
            "id": "segment-3",
            "type": "TEXT",
            "duration": 1.5,
            "label": "Text 3",
            "text": "It's pretty early in development"
        },
        "segment-pepe": {
            "id": "segment-pepe",
            "type": "IMAGE",
            "duration": 1.2,
            "label": "Rare Pepe",
            "url": "http://i.imgur.com/zC5bcAZ.gif"
        },
        "segment-4": {
            "id": "segment-4",
            "type": "TEXT",
            "duration": 1.2,
            "label": "Text 4",
            "text": "but please feel free to play around."
        },
        "segment-5": {
            "id": "segment-5",
            "type": "LOGO",
            "duration": 2.1,
            "label": "Logo"
        }
    },
    "duration": 9.3,
    "audio": {
        "id": "youtube-audio",
        "type": "YOUTUBE",
        "url": "https://www.youtube.com/watch?v=xBQv6hmZM80",
        "start": 20,
        "duration": 9.3,
        "label": "Audio"
    }
};
