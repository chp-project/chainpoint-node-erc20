#!/bin/bash
cd $(dirname $0)
source scripts/env_secrets_expand.sh
node register.js
