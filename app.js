{
  "name": "SkyVPS360",
  "description": "Cloud management platform",
  "env": {
    "NODE_ENV": {
      "description": "Environment",
      "value": "production"
    },
    "PORT": {
      "description": "Port to run on",
      "value": "8080"
    }
  },
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ]
}
