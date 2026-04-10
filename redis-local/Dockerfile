@'
FROM alpine:3.18
RUN apk add --no-cache redis
EXPOSE 6379
CMD ["redis-server", "--bind", "0.0.0.0", "--protected-mode", "no"]
'@ | Out-File -FilePath D:\CODE\event_mang_hackathon\redis-local\Dockerfile -Encoding utf8 -Force