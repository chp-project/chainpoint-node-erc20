/**
 * Copyright 2019 Tierion
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { version } = require('../../package.json')

/**
 * GET /config handler
 *
 * Returns a configuration information object
 */
async function getConfigInfoAsync(req, res, next) {
  res.contentType = 'application/json'

  res.send({
    version: version,
    time: new Date().toISOString()
  })
  return next()
}

module.exports = {
  getConfigInfoAsync: getConfigInfoAsync
}
