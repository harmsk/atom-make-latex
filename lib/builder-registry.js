/** @babel */

import _ from 'lodash'
import fs from 'fs-plus'
import path from 'path'

export default class BuilderRegistry {
  getBuilderImplementation (state) {
    const builders = this.getAllBuilders()
    const candidates = builders.filter(builder => builder.canProcess(state))

    // If a builder is specified, use that instead
    if (state.getBuilder()) {
      const namePattern = new RegExp(`^${state.getBuilder()}Builder$`, 'i')
      return _.find(candidates, builder => builder.name.match(namePattern))
    }

    switch (candidates.length) {
      case 0: return null
      case 1: return candidates[0]
    }

    // This should never happen...
    throw new Error('Ambiguous builder registration.')
  }

  getBuilder (state) {
    const BuilderImpl = this.getBuilderImplementation(state)
    return (BuilderImpl != null) ? new BuilderImpl() : null
  }

  async checkRuntimeDependencies () {
    const builders = this.getAllBuilders()
    for (const BuilderImpl of builders) {
      const builder = new BuilderImpl()
      await builder.checkRuntimeDependencies()
    }
  }

  getAllBuilders () {
    const moduleDir = this.getModuleDirPath()
    const entries = fs.readdirSync(moduleDir)
    const builders = entries.map(entry => require(path.join(moduleDir, entry)))

    return builders
  }

  getModuleDirPath () {
    return path.join(__dirname, 'builders')
  }
}
