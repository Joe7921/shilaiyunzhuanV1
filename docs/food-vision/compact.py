"""Reduce storage of convolution kernels; the original graph retains float convolution arithmetic and its uint8 input/output contracts. Run with ai-edge-litert, numpy and flatbuffers."""
from pathlib import Path
from copy import deepcopy
import zipfile
import flatbuffers
import numpy as np
from ai_edge_litert import schema_py_generated as S

def convert(kind):
 src=Path('1.tflite'); raw=src.read_bytes()
 m=S.ModelT.InitFromObj(S.Model.GetRootAsModel(raw,0));g=m.subgraphs[0]
 deq=S.OperatorCodeT();deq.builtinCode=deq.deprecatedBuiltinCode=S.BuiltinOperator.DEQUANTIZE;deq.version=5 if kind=='i8' else 3
 oi=len(m.operatorCodes);m.operatorCodes.append(deq);new_ops=[];count=0
 for op in g.operators:
  code=max(m.operatorCodes[op.opcodeIndex].builtinCode,m.operatorCodes[op.opcodeIndex].deprecatedBuiltinCode)
  if code in (S.BuiltinOperator.CONV_2D,S.BuiltinOperator.DEPTHWISE_CONV_2D):
   ti=op.inputs[1]; t=g.tensors[ti]; c=deepcopy(t)
   assert t.type==S.TensorType.FLOAT32
   shape=tuple(t.shape); buf=m.buffers[t.buffer]; w=buf.data.view('<f4').reshape(shape)
   if kind=='i8':
    axis=0 if code==S.BuiltinOperator.CONV_2D else 3
    peak=np.max(np.abs(w),axis=tuple(i for i in range(w.ndim) if i!=axis),keepdims=True)
    scales=np.where(peak>0,peak/127,1).astype('<f4')
    q=np.clip(np.rint(w/scales),-127,127).astype(np.int8)
    qp=S.QuantizationParametersT();qp.scale=scales.ravel();qp.zeroPoint=np.zeros(qp.scale.shape,dtype=np.int64);qp.quantizedDimension=axis
    c.type=S.TensorType.INT8;c.quantization=qp
   else:
    q=w.astype('<f2');c.type=S.TensorType.FLOAT16;c.quantization=None
   buf.data=q.ravel().view(np.uint8);c.name=t.name+b'/storage_'+kind.encode();t.buffer=0
   idx=len(g.tensors);g.tensors.append(c)
   dq=S.OperatorT();dq.opcodeIndex=oi;dq.inputs=np.asarray([idx],dtype=np.int32);dq.outputs=np.asarray([ti],dtype=np.int32)
   new_ops.append(dq);count+=1
  new_ops.append(op)
 g.operators=new_ops
 b=flatbuffers.Builder(1);root=m.Pack(b);b.Finish(root,file_identifier=b'TFL3')
 out=Path('food-'+kind+'.tflite');out.write_bytes(b.Output())
 with zipfile.ZipFile(src) as a,zipfile.ZipFile(out,'a') as z:
  for item in a.infolist():z.writestr(item,a.read(item))
 print(out,out.stat().st_size,count)
for mode in ['f16','i8']:convert(mode)
