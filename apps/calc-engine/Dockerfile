FROM python:3.11-slim
WORKDIR /app

COPY apps/calc-engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/calc-engine/app ./app

RUN addgroup --system appgroup && adduser --system --group appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]