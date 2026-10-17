import { useEffect, useRef, type CSSProperties } from 'react'

interface Props {
  image: ImageData
  className?: string
  style?: CSSProperties
  /** 代替テキスト。なければ 読み上げない */
  label?: string
}

/** ImageData を そのまま Canvas に描く（大きさは CSS で決める） */
export function ImageCanvas({ image, className, style, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    ref.current?.getContext('2d')?.putImageData(image, 0, 0)
  }, [image])
  return (
    <canvas
      ref={ref}
      width={image.width}
      height={image.height}
      className={className}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
