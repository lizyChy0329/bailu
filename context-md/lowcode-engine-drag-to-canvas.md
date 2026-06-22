 # Lowcode Engine 组件拖拽到画板逻辑
 
 > 基于 alibaba/lowcode-engine `packages/designer/src` 源码分析
 
 拖拽的核心逻辑集中在 `designer` 包的三个模块中：**Dragon（拖拽引擎）**、**Sensor / SimulatorHost（感应器）**、**Designer（编排器）**。下面以源码为主线，梳理完整流程。
 
 ## 目录
 
 - [1. 整体流程图](#1-整体流程图)
 - [2. 核心数据结构](#2-核心数据结构)
 - [3. 拖拽发起（Drag Boost）](#3-拖拽发起drag-boost)
 - [4. Dragon.boost() —— 拖拽引擎](#4-dragonboost--拖拽引擎)
 - [5. Sensor.locate() —— 落点计算](#5-sensorlocate--落点计算)
 - [6. Dragend —— 放置落地](#6-dragend--放置落地)
 - [7. 关键代码文件](#7-关键代码文件)
 
 ## 1. 整体流程图
 
 ```
 鼠标按下 → Dragon.boost()
   → 鼠标移动超过 4px（抖动检测）→ dragstart
     → 持续 mousemove
       → 创建 LocateEvent（坐标转换）
       → 选择 Sensor（通常为画板模拟器）
       → Sensor.locate() 计算落点
         → getDropContainer() 找可插入的容器节点
         → handleAccept() 检查组件的嵌套规则
         → 遍历子节点 DOM 矩形，算最近位置 & 决定 before/after
         → Designer.createLocation() 创建 DropLocation & 更新蓝线指示器
       → 发射 drag 事件
     → 鼠标松开
       → insertChildren(target, data/节点列表, index) → 组件渲染到画板
       → 选中新节点
       → 发射 dragend 事件
       → 清除拖拽态
 ```
 
 ## 2. 核心数据结构
 
 ### DragObject（拖拽对象）
 
 两种类型，定义在 `@alilc/lowcode-types` 中：
 
 - **`IPublicTypeDragNodeObject`**（`type = Node`）—— 拖拽画布上已有的节点，携带 `nodes: INode[]`
 - **`IPublicTypeDragNodeDataObject`**（`type = NodeData`）—— 从组件面板拖入新组件，携带 `data: IPublicTypeNodeData[]`
 
 ### LocateEvent（定位事件）
 
 ```typescript
 interface ILocateEvent {
   type: 'LocateEvent';
   dragObject: IPublicModelDragObject;
   target: EventTarget;
   originalEvent: MouseEvent | DragEvent;
   globalX: number;
   globalY: number;
   canvasX?: number;
   canvasY?: number;
   sensor?: IPublicModelSensor;
   fixed?: boolean;
 }
 ```
 
 ### DropLocation（落点）
 
 ```typescript
 class DropLocation {
   target: INode;
   detail: IPublicTypeLocationDetail;
   event: ILocateEvent;
   source: string;
   get document(): IDocumentModel | null;
 }
 ```
 
 其中 `detail` 的 `IPublicTypeLocationChildrenDetail` 包含：
 - `type: 'Children'` —— 插入到子元素中
 - `index: number` —— 插入位置
 - `near?: { node, pos: 'before' | 'after' | 'replace', align: 'V' | 'H' }` —— 邻近参考节点
 - `edge?: IPublicTypeRect` —— 容器边缘矩形
 
 ## 3. 拖拽发起（Drag Boost）
 
 ### 3.1 从组件面板拖出新组件
 
 组件面板通过 `Dragon.from()` 在 DOM 上注册 `mousedown`：
 
 ```typescript
 // packages/designer/src/designer/dragon.ts
 from(shell: Element, boost: (e: MouseEvent) => IPublicModelDragObject | null) {
   const mousedown = (e: MouseEvent) => {
     if (e.which === 3 || e.button === 2) return;
     const dragObject = boost(e);
     if (!dragObject) return;
     this.boost(dragObject, e);
   };
   shell.addEventListener('mousedown', mousedown as any);
   return () => { shell.removeEventListener('mousedown', mousedown as any); };
 }
 ```
 
 `boost` 回调创建 `IPublicTypeDragNodeDataObject`，携带组件 schema：
 
 ```json
 { "type": "NodeData", "data": { "componentName": "Button", ... } }
 ```
 
 ### 3.2 从画布拖拽已有节点
 
 在 `builtin-simulator/host.ts` 中，`mousedown` 事件处理：
 
 - 判断是否是左键、是否可选中、是否是多选
 - 如果是可拖拽的节点，调用 `designer.dragon.boost()`
 - 如果节点是 RGL 组件（React Grid Layout），传入 `rglNode` 参数用于 RGL 特殊处理
 
 关键代码位置：`host.ts` 第 648 行附近。
 
 ## 4. Dragon.boost() —— 拖拽引擎
 
 文件：`/packages/designer/src/designer/dragon.ts`
 
 这是整个拖拽的中枢方法。主要职责：
 
 ### 4.1 准备阶段
 
 - 获取所有可用的 Sensor（所有文档的活跃模拟器）
 - 创建事件处理器（`handleEvents`），兼容 iframe 沙箱
 - 禁用文本选区、设置拖拽光标
 - 判断是否是全新的拖拽（`newBie`: 非 Node 类型）、是否是强制复制（slot 节点）
 
 ### 4.2 抖动检测
 
 ```typescript
 const SHAKE_DISTANCE = 4;
 
 function isShaken(e1: MouseEvent | DragEvent, e2: MouseEvent | DragEvent): boolean {
   if (e1.shaken) return true;
   if (e1.target !== e2.target) return true;
   return Math.pow(e1.clientY - e2.clientY, 2) + Math.pow(e1.clientX - e2.clientX, 2) > SHAKE_DISTANCE;
 }
 ```
 
 鼠标移动超过 4px 才正式启动拖拽，避免误触。
 
 ### 4.3 Dragstart
 
 ```typescript
 const dragstart = () => {
   this._dragging = true;
   setShaken(boostEvent);
   const locateEvent = createLocateEvent(boostEvent);
   if (newBie || forceCopyState) {
     this.setCopyState(true);
   } else {
     chooseSensor(locateEvent);
   }
   this.setDraggingState(true);
   handleEvents((doc) => { doc.addEventListener('keydown', checkesc, false); });
   this.emitter.emit('dragstart', locateEvent);
 };
 ```
 
 ### 4.4 Drag 过程（持续 mousemove）
 
 ```typescript
 const drag = (e: MouseEvent | DragEvent) => {
   checkcopy(e);
   if (isInvalidPoint(e, lastArrive)) return;
   if (lastArrive && isSameAs(e, lastArrive)) { lastArrive = e; return; }
   lastArrive = e;
 
   const { isRGL, rglNode } = getRGL(e);
   const locateEvent = createLocateEvent(e);
   const sensor = chooseSensor(locateEvent);
 
   if (isRGL) { /* ... RGL 拖拽逻辑 ... */ }
   else {
     this._canDrop = false;
     this.emitter.emit('rgl.remove.placeholder');
     this.emitter.emit('rgl.sleeping', true);
   }
   if (sensor) {
     sensor.fixEvent(locateEvent);
     sensor.locate(locateEvent);
   } else { designer.clearLocation(); }
   this.emitter.emit('drag', locateEvent);
 };
 ```
 
 核心步骤：**创建 LocateEvent → 选择 Sensor → fixEvent 坐标订正 → sensor.locate() 计算落点 → 发射 drag 事件**。
 
 ### 4.5 chooseSensor（选择感应器）
 
 ```typescript
 const chooseSensor = (e: ILocateEvent) => {
   const sensors = this.sensors.concat(masterSensors);
   let sensor = e.sensor && e.sensor.isEnter(e)
     ? e.sensor
     : sensors.find((s) => s.sensorAvailable && s.isEnter(e));
   if (!sensor) { sensor = lastSensor || e.sensor || sourceSensor; }
   if (sensor !== lastSensor) {
     if (lastSensor) lastSensor.deactiveSensor();
     lastSensor = sensor;
   }
   if (sensor) { e.sensor = sensor; sensor.fixEvent(e); }
   this._activeSensor = sensor;
   return sensor;
 };
 ```
 
 ### 4.6 坐标转换（createLocateEvent）
 
 ```typescript
 const createLocateEvent = (e: MouseEvent | DragEvent): ILocateEvent => {
   const evt: any = { type: 'LocateEvent', dragObject, target: e.target, originalEvent: e };
   const sourceDocument = e.view?.document;
   if (!sourceDocument || sourceDocument === document) {
     evt.globalX = e.clientX; evt.globalY = e.clientY;
   } else {
     // 事件来自 iframe 沙箱，通过 viewport.toGlobalPoint 转换
     const g = srcSim.viewport.toGlobalPoint(e);
     evt.globalX = g.clientX; evt.globalY = g.clientY;
     evt.canvasX = e.clientX; evt.canvasY = e.clientY;
     evt.sensor = srcSim;
   }
   return evt;
 };
 ```
 
 ### 4.7 Dragon 类的传感器管理 & 事件 API
 
 ```typescript
 addSensor(sensor: any) { this.sensors.push(sensor); }
 removeSensor(sensor: any) {
   const i = this.sensors.indexOf(sensor);
   if (i > -1) this.sensors.splice(i, 1);
 }
 
 onDragstart(func: (e: ILocateEvent) => any) {
   this.emitter.on('dragstart', func);
   return () => this.emitter.removeListener('dragstart', func);
 }
 onDrag(func: (e: ILocateEvent) => any) {
   this.emitter.on('drag', func);
   return () => this.emitter.removeListener('drag', func);
 }
 onDragend(func: (x: { dragObject: IPublicModelDragObject; copy: boolean }) => any) {
   this.emitter.on('dragend', func);
   return () => this.emitter.removeListener('dragend', func);
 }
 ```
 
 ## 5. Sensor.locate() —— 落点计算
 
 文件：`packages/designer/src/builtin-simulator/host.ts`
 
 这是 `BuiltinSimulatorHost`（也实现了 `IPublicModelSensor`）中最关键的逻辑。
 
 ### 5.1 fixEvent（坐标订正）
 
 ```typescript
 // host.ts 第 1135 行
 fixEvent(e: ILocateEvent): ILocateEvent {
   if (e.fixed) return e;
   const notMyEvent = e.originalEvent.view?.document !== this.contentDocument;
   if (notMyEvent || !('canvasX' in e) || !('canvasY' in e)) {
     const l = this.viewport.toLocalPoint({ clientX: e.globalX, clientY: e.globalY });
     e.canvasX = l.clientX;
     e.canvasY = l.clientY;
   }
   if (!e.target || notMyEvent) {
     if (!isNaN(e.canvasX!) && !isNaN(e.canvasY!)) {
       e.target = this.contentDocument?.elementFromPoint(e.canvasX!, e.canvasY!);
     }
   }
   e.fixed = true;
   return e;
 }
 
 // host.ts 第 1166 行：判断鼠标是否进入该模拟器的视口范围
 isEnter(e: ILocateEvent): boolean {
   const rect = this.viewport.bounds;
   return (
     e.globalY >= rect.top && e.globalY <= rect.bottom &&
     e.globalX >= rect.left && e.globalX <= rect.right
   );
 }
 
 deactiveSensor() { this.sensing = false; this.scroller.cancel(); }
 ```
 
 ### 5.2 locate（核心落点计算——完整方法）
 
 ```typescript
 // host.ts 第 1189 行
 locate(e: ILocateEvent): any {
   const { dragObject } = e;
 
   const nodes = dragObject?.nodes;
   const operationalNodes = nodes?.filter((node) => {
     const onMoveHook = node.componentMeta?.advanced.callbacks?.onMoveHook;
     const canMove = onMoveHook && typeof onMoveHook === 'function'
       ? onMoveHook(node.internalToShellNode()) : true;
     let parentContainerNode: INode | null = null;
     let parentNode = node.parent;
     while (parentNode) {
       if (parentNode.isContainer()) { parentContainerNode = parentNode; break; }
       parentNode = parentNode.parent;
     }
     const onChildMoveHook = parentContainerNode?.componentMeta?.advanced.callbacks?.onChildMoveHook;
     const childrenCanMove = onChildMoveHook && parentContainerNode && typeof onChildMoveHook === 'function'
       ? onChildMoveHook(node.internalToShellNode(), parentContainerNode.internalToShellNode()) : true;
     return canMove && childrenCanMove;
   });
   if (nodes && (!operationalNodes || operationalNodes.length === 0)) return;
 
   this.sensing = true;
   this.scroller.scrolling(e);
   const document = this.project.currentDocument;
   if (!document) return null;
 
   const dropContainer = this.getDropContainer(e);
   const lockedNode = getClosestNode(dropContainer?.container, (node) => node.isLocked);
   if (lockedNode) return null;
   if (!dropContainer) return null;
 
   if (isLocationData(dropContainer)) {
     return this.designer.createLocation(dropContainer);
   }
 
   const { container, instance: containerInstance } = dropContainer;
   const edge = this.computeComponentInstanceRect(containerInstance, container.componentMeta.rootSelector);
   if (!edge) return null;
 
   const { children } = container;
   const detail: IPublicTypeLocationChildrenDetail = {
     type: IPublicTypeLocationDetailType.Children,
     index: 0,
     edge,
   };
   const locationData = { target: container, detail, source: `simulator${document.id}`, event: e };
 
   if (e.dragObject && e.dragObject.nodes && e.dragObject.nodes.length &&
       e.dragObject.nodes[0].componentMeta.isModal && document.focusNode) {
     return this.designer.createLocation({
       target: document.focusNode, detail, source: `simulator${document.id}`, event: e,
     });
   }
 
   if (!children || children.size < 1 || !edge) {
     return this.designer.createLocation(locationData);
   }
 
   let nearRect: IPublicTypeRect | null = null;
   let nearIndex: number = 0;
   let nearNode: INode | null = null;
   let nearDistance: number | null = null;
   let minTop: number | null = null;
   let maxBottom: number | null = null;
 
   for (let i = 0, l = children.size; i < l; i++) {
     const node = children.get(i)!;
     const index = i;
     const instances = this.getComponentInstances(node);
     const inst = instances
       ? instances.length > 1
         ? instances.find(
             (_inst) => this.getClosestNodeInstance(_inst, container.id)?.instance === containerInstance,
           )
         : instances[0]
       : null;
     const rect = inst
       ? this.computeComponentInstanceRect(inst, node.componentMeta.rootSelector)
       : null;
     if (!rect) continue;
 
     const distance = isPointInRect(e as any, rect) ? 0 : distanceToRect(e as any, rect);
 
     if (distance === 0) { nearDistance = distance; nearNode = node; nearIndex = index; nearRect = rect; break; }
 
     if (minTop === null || rect.top < minTop) minTop = rect.top;
     if (maxBottom === null || rect.bottom > maxBottom) maxBottom = rect.bottom;
 
     if (nearDistance === null || distance < nearDistance) {
       nearDistance = distance; nearNode = node; nearIndex = index; nearRect = rect;
     }
   }
 
   detail.index = nearIndex;
 
   if (nearNode && nearRect) {
     const el = getRectTarget(nearRect);
     const inline = el ? isChildInline(el) : false;
     const row = el ? isRowContainer(el.parentElement!) : false;
     const vertical = inline || row;
 
     const near = {
       node: nearNode.internalToShellNode()!,
       pos: 'before' as const,
       align: (vertical ? 'V' : 'H') as 'V' | 'H',
     };
     detail.near = near;
     if (isNearAfter(e as any, nearRect, vertical)) {
       near.pos = 'after';
       detail.index = nearIndex + 1;
     }
     if (!row && nearDistance !== 0) {
       const edgeDistance = distanceToEdge(e as any, edge);
       if (edgeDistance.distance < nearDistance!) {
         const { nearAfter } = edgeDistance;
         if (minTop == null) minTop = edge.top;
         if (maxBottom == null) maxBottom = edge.bottom;
         near.rect = new DOMRect(edge.left, minTop, edge.width, maxBottom - minTop);
         near.align = 'H';
         near.pos = nearAfter ? 'after' : 'before';
         detail.index = nearAfter ? children.size : 0;
       }
     }
   }
 
   return this.designer.createLocation(locationData);
 }
 ```
 
 ### 5.3 getDropContainer（查找目标容器）
 
 ```typescript
 // host.ts 第 1410 行附近
 getDropContainer(e: ILocateEvent): DropContainer | null {
   const { target, dragObject } = e;
   const isAny = isDragAnyObject(dragObject);
   const document = this.project.currentDocument!;
   const { currentRoot } = document;
   let container: INode | null;
   let nodeInstance: IPublicTypeNodeInstance | undefined;
 
   if (target) {
     const ref = this.getNodeInstanceFromElement(target);
     if (ref?.node) { nodeInstance = ref; container = ref.node; }
     else if (isAny) return null;
     else container = currentRoot;
   } else if (isAny) return null;
   else container = currentRoot;
 
   if (!container?.isParental()) {
     container = container?.parent || currentRoot;
   }
 
   if (isDragNodeObject(dragObject)) {
     const { nodes } = dragObject;
     let i = nodes.length;
     let p: any = container;
     while (i-- > 0) {
       if (contains(nodes[i], p)) { p = nodes[i].parent; }
     }
     if (p !== container) {
       container = p || document.focusNode;
       container && drillDownExcludes.add(container);
     }
   }
 
   let instance: any;
   if (nodeInstance) {
     if (nodeInstance.node === container) instance = nodeInstance.instance;
     else instance = this.getClosestNodeInstance(nodeInstance.instance, container?.id)?.instance;
   } else {
     instance = container && this.getComponentInstances(container)?.[0];
   }
 
   let dropContainer: DropContainer = { container: container as any, instance };
   let upward: DropContainer | null = null;
   while (container) {
     const res = this.handleAccept(dropContainer, e);
     if (res === true) return dropContainer;
     if (!res) {
       drillDownExcludes.add(container);
       if (upward) { dropContainer = upward; container = dropContainer.container; upward = null; }
       else if (container.parent) {
         container = container.parent;
         instance = this.getClosestNodeInstance(dropContainer.instance, container.id)?.instance;
         dropContainer = { container, instance };
       } else return null;
     }
   }
   return null;
 }
 
 handleAccept({ container }: DropContainer, e: ILocateEvent): boolean {
   const { dragObject } = e;
   const document = this.currentDocument!;
   const { focusNode } = document;
   if (isRootNode(container) || container.contains(focusNode)) {
     return document.checkNesting(focusNode!, dragObject as any);
   }
   const meta = (container as Node).componentMeta;
   const acceptable: boolean = this.isAcceptable(container);
   if (!meta.isContainer && !acceptable) return false;
   return document.checkNesting(container, dragObject as any);
 }
 ```
 
 ## 6. Dragend —— 放置落地
 
 文件：`packages/designer/src/designer/designer.ts`
 
 Designer 在初始化时就监听了 `dragon.onDragend`：
 
 ```typescript
 // designer.ts 构造函数中
 this.dragon.onDragend((e) => {
   const { dragObject, copy } = e;
   const loc = this._dropLocation;
   if (loc) {
     if (isLocationChildrenDetail(loc.detail) && loc.detail.valid !== false) {
       let nodes: INode[] | undefined;
       if (isDragNodeObject(dragObject)) {
         nodes = insertChildren(loc.target, [...dragObject.nodes], loc.detail.index, copy);
       } else if (isDragNodeDataObject(dragObject)) {
         const nodeData = Array.isArray(dragObject.data) ? dragObject.data : [dragObject.data];
         const isNotNodeSchema = nodeData.find((item) => !isNodeSchema(item));
         if (isNotNodeSchema) return;
         nodes = insertChildren(loc.target, nodeData, loc.detail.index);
       }
       if (nodes) {
         loc.document?.selection.selectAll(nodes.map((o) => o.id));
         setTimeout(() => this.activeTracker.track(nodes![0]), 10);
       }
     }
   }
   if (this.props?.onDragend) { this.props.onDragend(e, loc); }
   this.postEvent('dragend', e, loc);
   this.detecting.enable = true;
 });
 ```
 
 ### 6.1 insertChildren（插入节点到文档树）
 
 文件：`packages/designer/src/document/node/node.ts`
 
 ```typescript
 export function insertChild(
   container: INode,
   thing: INode | IPublicTypeNodeData,
   at?: number | null,
   copy?: boolean,
 ): INode | null {
   let node: INode | null | IRootNode | undefined;
   let nodeSchema: IPublicTypeNodeSchema;
   if (isNode<INode>(thing) && (copy || thing.isSlot())) {
     nodeSchema = thing.export(IPublicEnumTransformStage.Clone);
     node = container.document?.createNode(nodeSchema);
   } else if (isNode<INode>(thing)) {
     node = thing;
   } else if (isNodeSchema(thing)) {
     node = container.document?.createNode(thing);
   }
   if (isNode<INode>(node)) { container.children?.insert(node, at); return node; }
   return null;
 }
 
 export function insertChildren(
   container: INode,
   nodes: INode[] | IPublicTypeNodeData[],
   at?: number | null,
   copy?: boolean,
 ): INode[] {
   let index = at;
   let node: any;
   const results: INode[] = [];
   while ((node = nodes.pop())) {
     node = insertChild(container, node, index, copy);
     results.push(node);
     index = node.index;
   }
   return results;
 }
 ```
 
 ### 6.2 Designer 的 createLocation / clearLocation
 
 ```typescript
 // designer.ts
 createLocation(locationData: IPublicTypeLocationData<INode>): DropLocation {
   const loc = new DropLocation(locationData);
   if (this._dropLocation && this._dropLocation.document && this._dropLocation.document !== loc.document) {
     this._dropLocation.document.dropLocation = null;
   }
   this._dropLocation = loc;
   this.postEvent('dropLocation.change', loc);
   if (loc.document) { loc.document.dropLocation = loc; }
   this.activeTracker.track({ node: loc.target, detail: loc.detail });
   return loc;
 }
 
 clearLocation() {
   if (this._dropLocation && this._dropLocation.document) {
     this._dropLocation.document.dropLocation = null;
   }
   this.postEvent('dropLocation.change', undefined);
   this._dropLocation = undefined;
 }
 ```
 
 ## 7. 关键代码文件
 
 所有路径均相对于 `packages/designer/src/`：
 
 | 文件 | 路径 | 作用 |
 |------|------|------|
 | dragon.ts | `designer/dragon.ts` | 拖拽引擎核心（Dragon 类） |
 | designer.ts | `designer/designer.ts` | Designer 编排器，处理 dragend 落点落地 |
 | location.ts | `designer/location.ts` | DropLocation 类及布局方向辅助函数 |
 | host.ts | `builtin-simulator/host.ts` | 模拟器宿主（Sensor），核心 locate 落点计算 |
 | node.ts | `document/node/node.ts` | insertChildren / insertChild 插入逻辑 |
 | insertion.tsx | `builtin-simulator/bem-tools/insertion.tsx` | 蓝线插入指示器可视化组件 |
 | viewport.ts | `builtin-simulator/viewport.ts` | 视口管理（坐标转换、边界计算） |
 | scroller.ts | `designer/scroller.ts` | 拖拽时自动滚动 |
 
 ## 总结
 
 低代码引擎的拖拽逻辑可以概括为三个阶段：
 
 1. **发起（Boost）** —— 通过 `mouseDown` + 4px 抖动检测确定用户意图，构建 `DragObject`
 2. **定位（Locate）** —— 持续 `mousemove` 中，由 `Sensor.locate()` 计算最近的容器和精确的插入索引
 3. **落地（Drop）** —— `mouseup` 时，根据 `DropLocation` 的 `target` 和 `index`，调用 `insertChildren()` 执行实际的节点插入/移动/复制
 
 其中，落点定位是最复杂的部分：它在虚拟的文档树节点和实际的 DOM 矩形之间做映射，同时考虑 CSS 布局方向（flex row/column、inline）和组件嵌套规则校验。
