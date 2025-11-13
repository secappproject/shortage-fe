"use client";

import { Stage, Layer, Image, Rect, Group, Text } from "react-konva";
import useImage from "use-image";
import { RawDetectionBox } from "@/lib/types";
import { KonvaEventObject } from "konva/lib/Node";
import { useState, useRef, useEffect } from "react";
import { Stage as StageType } from "konva/lib/Stage";
import Konva from 'konva';
import { BOX_COLORS, simpleStringHash } from "@/lib/colors";

type AnnotationCanvasProps = {
  imageUrl: string;
  detections: RawDetectionBox[];
  onDeleteDetection: (index: number) => void;
  onAddDetection: (data: { box: number[]; crop: string }) => void;
  canEdit: boolean;
  mode: 'pan' | 'draw';
  selectedClassName: string | null;
  selectedDetectionIndex: number | null;
};

const getBoxProps = (
  box: number[],
  imageWidth: number,
  imageHeight: number
) => {
  const [x_norm, y_norm, w_norm, h_norm] = box;
  return {
    x: x_norm * imageWidth - (w_norm * imageWidth / 2),
    y: y_norm * imageHeight - (h_norm * imageHeight / 2),
    width: w_norm * imageWidth,
    height: h_norm * imageHeight,
  };
};

export function AnnotationCanvas({
  imageUrl,
  detections,
  onDeleteDetection,
  onAddDetection,
  canEdit,
  mode,
  selectedClassName,
  selectedDetectionIndex,
}: AnnotationCanvasProps) {
  const [img] = useImage(imageUrl);
  const imageWidth = img ? img.width : 0;
  const imageHeight = img ? img.height : 0;

  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const [isDrawing, setIsDrawing] = useState(false);
  const [newBox, setNewBox] = useState<number[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageType>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current && imageWidth > 0 && imageHeight > 0) {
      const { clientWidth, clientHeight } = containerRef.current;
      setContainerSize({ width: clientWidth, height: clientHeight });

      const scaleX = clientWidth / imageWidth;
      const scaleY = clientHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY);

      if (scale < 1) {
        setStageScale(scale);
        const x = (clientWidth - imageWidth * scale) / 2;
        const y = (clientHeight - imageHeight * scale) / 2;
        setStagePos({ x, y });
      } else {
        setStageScale(1); 
        const x = (clientWidth - imageWidth) / 2;
        const y = (clientHeight - imageHeight) / 2;
        setStagePos({ x, y });
      }
    }
  }, [containerRef, imageWidth, imageHeight]);

  useEffect(() => {
    if (selectedDetectionIndex === null || !stageRef.current || !img) return;
    
    const detection = detections[selectedDetectionIndex];
    if (!detection) return;

    const { width: containerWidth, height: containerHeight } = containerSize;
    if (containerWidth === 0) return;

    const props = getBoxProps(detection.box, imageWidth, imageHeight);
    const boxCenterX = props.x + props.width / 2;
    const boxCenterY = props.y + props.height / 2;
    
    const scaleX = containerWidth / (props.width * 1.25); 
    const scaleY = containerHeight / (props.height * 1.25);
    const newScale = Math.min(scaleX, scaleY, 3);
    
    const newX = (containerWidth / 2) - (boxCenterX * newScale);
    const newY = (containerHeight / 2) - (boxCenterY * newScale);
    
    stageRef.current.to({
      scaleX: newScale,
      scaleY: newScale,
      x: newX,
      y: newY,
      duration: 0.3,
      easing: Konva.Easings.EaseInOut,
    });

  }, [selectedDetectionIndex]);

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const scaleBy = 1.02; 
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStageScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStagePos(newPos);
  };
  
  const handleDrawMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (mode !== 'draw' || !canEdit) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    setIsDrawing(true);
    
    const relativePos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleX()
    };
    
    setNewBox([relativePos.x, relativePos.y, relativePos.x, relativePos.y]);
  };

  const handleDrawMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (mode !== 'draw' || !isDrawing || !canEdit) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const [x1, y1] = newBox;
    
    const relativePos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleX()
    };
    
    setNewBox([x1, y1, relativePos.x, relativePos.y]);
  };
const handleDrawMouseUp = () => {
    if (mode !== 'draw' || !isDrawing || !canEdit || !img) return; 
    
    setIsDrawing(false);

    const [x1, y1, x2, y2] = newBox;
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    
    const realX1 = Math.min(x1, x2);
    const realY1 = Math.min(y1, y2);

    if (width > 5 && height > 5 && imageWidth > 0 && imageHeight > 0) {
      const w_norm = width / imageWidth;
      const h_norm = height / imageHeight;
      const x_center_norm = (realX1 / imageWidth) + (w_norm / 2);
      const y_center_norm = (realY1 / imageHeight) + (h_norm / 2);
      
      let cropDataUrl = "";
      try {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = width;
        cropCanvas.height = height;
        const ctx = cropCanvas.getContext('2d');
        
        if (ctx && img) { 
          ctx.drawImage(
            img,
            realX1, 
            realY1, 
            width,  
            height,
            0,   
            0,   
            width, 
            height 
          );
          cropDataUrl = cropCanvas.toDataURL('image/jpeg');
        }
      } catch (e) {
        console.error("Gagal membuat crop:", e);
      }
      onAddDetection({
        box: [x_center_norm, y_center_norm, w_norm, h_norm],
        crop: cropDataUrl 
      });
    }
    setNewBox([]);
  };
  return (
    <div
      ref={containerRef}
      className="border rounded-md bg-muted/30 h-full w-full overflow-hidden"
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={mode === 'pan'} 
        style={{ cursor: mode === 'draw' ? 'crosshair' : (mode === 'pan' ? 'grab' : 'default') }}
      >
        <Layer>
          <Image image={img} listening={false} />
          
          <Rect
            x={0}
            y={0}
            width={imageWidth}
            height={imageHeight}
            fill="transparent"
            onMouseDown={handleDrawMouseDown}
            onMouseMove={handleDrawMouseMove}
            onMouseUp={handleDrawMouseUp}
            listening={mode === 'draw' && canEdit}
          />
          
          {detections.map((det, i) => {
            const props = getBoxProps(det.box, imageWidth, imageHeight);
            const hash = simpleStringHash(det.class_name);
            const color = BOX_COLORS[hash % BOX_COLORS.length];
            
            const isClassSelected = det.class_name === selectedClassName;
            const isIndexSelected = i === selectedDetectionIndex;
            
            return (
              <Group key={i} listening={true}> 
                <Rect
                  {...props}
                  stroke={color}
                  strokeWidth={isClassSelected ? 4 : 2}
                  opacity={isClassSelected ? 1.0 : 0.8}
                  listening={false}
                />
                
                {isIndexSelected && (
                  <Rect
                    {...props}
                    stroke="#00FF00"
                    strokeWidth={4 / stageScale}
                    listening={false}
                  />
                )}

                {det.class_name && det.class_name.trim() !== "" && (
                  <Text
                    text={det.class_name}
                    x={props.x}
                    y={props.y - 14}
                    fill="white"
                    padding={2}
                    fontSize={12}
                    backgroundColor={color}
                    opacity={0.8}
                    listening={false}
                  />
                )}
                
                {canEdit && (
                  <Text
                    text="X"
                    x={props.x + props.width - 16}
                    y={props.y + 2}
                    fill="white"
                    stroke={color}
                    fontSize={12}
                    padding={2}
                    onClick={() => onDeleteDetection(i)}
                    onTap={() => onDeleteDetection(i)}
                    style={{ cursor: "pointer" }}
                    listening={true}
                  />
                )}
              </Group>
            );
          })}
          
          {newBox.length === 4 && (
            <Rect
              x={Math.min(newBox[0], newBox[2])}
              y={Math.min(newBox[1], newBox[3])}
              width={Math.abs(newBox[2] - newBox[0])}
              height={Math.abs(newBox[3] - newBox[1])}
              stroke="blue"
              strokeWidth={2 / stageScale}
              dash={[5, 5]}
              listening={false}
            />
          )}
          
        </Layer>
      </Stage>
    </div>
  );
}