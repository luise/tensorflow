FROM python:2

WORKDIR /usr/src/app
RUN pip install --no-cache-dir tensorflow==1.3.0

ENTRYPOINT []
