FROM python:3.11-slim

WORKDIR /svc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN useradd --create-home vik && chown -R vik:vik /svc
USER vik

EXPOSE 8013
# Shell form (not exec form) so $PORT is substituted at runtime — Render's
# Docker-runtime web services inject PORT and require the container to bind
# to it; docker-compose never sets PORT, so this falls back to 8013 there.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8013}
