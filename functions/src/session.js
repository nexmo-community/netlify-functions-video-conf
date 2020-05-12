import dotenv from 'dotenv'
dotenv.config()

import faunadb, { query as q } from 'faunadb'
const client = new faunadb.Client({ secret: process.env.FAUNA_SECRET })

const OpenTok = require("opentok");
const OT = new OpenTok(process.env.VONAGE_KEY, process.env.VONAGE_SECRET);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type'
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod == 'OPTIONS') {
      return { 
        headers: { ...headers, 'Allow': 'POST' }, 
        statusCode: 204 
      }
    }

    const { name } = JSON.parse(event.body)

    const doesSessionExist = await client.query(
      q.Exists(q.Match(q.Index('sessions_by_name'), name))
    )

    let document
    if(doesSessionExist) {
      document = await client.query(
        q.Get(q.Match(q.Index('sessions_by_name'), name))
      )
    } else {
      document = await createSession(name)
    }

    const token = OT.generateToken(document.data.id, {
      role: 'publisher',
      data: `roomname=${document.data.name}`
    })

    return { 
      headers, 
      statusCode: 200, 
      body: JSON.stringify({
        token,
        sessionId: document.data.id,
        apiKey: process.env.VONAGE_KEY
      }) 
    }
  } catch(e) {
    console.error('Error', e)
    return { headers, statusCode: 500, body: 'Error: ' + e }
  }
}

const createSession = (name) => {
  return new Promise((resolve, reject) => {
    OT.createSession(async (error, session) => {
      try {
        if(error) { throw error }

        // Send document to FaunaDB
        const document = await client.query(
          q.Create(
            q.Collection('sessions'), 
            { data: { name, id: session.sessionId }}
          )
        )
        
        resolve(document)
      } catch(e) {
        reject(e)
      }
    })
  })
}