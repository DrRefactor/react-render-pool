import React from "react"
import { RenderPool, RenderPoolChild } from "../render-pool/RenderPool"
import { range } from "../utils"

export const MassiveList: React.FC = () => {
  return (
    <RenderPool poolSize={10} renderInterval={500}>
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignContent: 'flex-start'
        }}
      >
        {range(1500).map(i => (
          <RenderPoolChild key={i}>
            <div
              style={{
                borderWidth: 1,
                borderColor: 'cyan',
                borderRadius: 40,
                borderStyle: 'solid',
                width: '25px',
                height: '25px',
                margin: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{fontSize: 8, color: 'white'}}
              >{i}</div>
            </div>
          </RenderPoolChild>
        ))}
      </div>
    </RenderPool>
  )
}