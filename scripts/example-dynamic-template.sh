#!/bin/bash

curl \
  http://0.0.0.0:13987/send \
  -v \
  -X POST \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "templateId": "d-xxx",
  "strategies": "sendgrid",
  "data": {
    "from": "test@example.com",
    "to": "test@example.com",
    "payload": {
        "customerName": "Giannis"
    }
  }
}
EOF
