import pc = require("playcanvas");
import { createScript, ScriptTypeBase, attrib } from "../lib/create-script-decorator";
import { NodeObject } from "./nodeObject";
import { UIMgr } from "./UI/uimgr";
import { Helper } from "./helper/helper";
import { NodeData } from "./data/nodeData";

interface CoreData {
    score : number,
    multiply : number,
    baseScore : number,
    nextVal : number,
    step : number,
    level : number;
    isStarted : boolean,
    UsedBlock : number
};

@createScript("core")
export class Core extends ScriptTypeBase  {
    static MAX_BLOCK : number = 7;
    private static  _sharedInc : Core;
    public static get SharedInc(){
        return this._sharedInc;
    };

    @attrib({type:'entity'}) BlockerEntity : pc.Entity;
    @attrib({type:'entity'}) BlockNode: pc.Entity;
    @attrib({type:'entity'}) debugText: pc.Entity;
    @attrib({type:'entity'}) scoreText: pc.Entity;
    @attrib({type:'entity'}) nextText: pc.Entity;
    @attrib({type:'entity'}) stepText: pc.Entity;
    @attrib({type:'entity'}) UIMgrEntity: pc.Entity;
    @attrib({type:'asset', assetType:'json'}) nodeData : pc.Asset;

    ans: Array<Array<NodeObject>> = [];
    txtDebug : pc.ElementComponent;
    txtScore : pc.ElementComponent;
    txtNext : pc.ElementComponent;
    txtStep : pc.ElementComponent;

    // set of data for game core need
    gameData : CoreData;
    nodePercent : NodeData;

    // holding the instance of UI
    sharedUIMgr : UIMgr;

    initialize(){
        Core._sharedInc = this;
        this.gameData = {
            score : 0,
            multiply : 1,
            baseScore : 7,
            nextVal : 0,
            step : 0,
            level : 1,
            isStarted : false,
            UsedBlock : 0
        };

        this.BlockerEntity.enabled = true;

        let i :number, j :number;
        for(j = 0; j < Core.MAX_BLOCK; ++j) {
            this.ans[j] = [];
            for(i = 0; i < Core.MAX_BLOCK; ++i){
                let _node :pc.Entity = this.BlockNode.clone();
    
                //_node.entity.translate(1.5 + i*0.5, 0, 0);
                _node.setPosition(-1.5 + j * 0.5, -1.5 + i * 0.5, 0);
                if(_node.script.has('NodeObject')){
                   
                    let _nodeObj:NodeObject = <NodeObject> _node.script.get('NodeObject');

                    _nodeObj.gridX = j;
                    _nodeObj.gridY = i;
                    
                    this.BlockNode.parent.addChild(_node);
                    
                    this.ans[j][i] = _nodeObj;
                }
            }
        }
        
        this.txtDebug = this.debugText.findComponent('element') as pc.ElementComponent;
        this.txtScore = this.scoreText.findComponent('element') as pc.ElementComponent;
        this.txtNext = this.nextText.findComponent('element') as pc.ElementComponent;
        this.txtStep = this.stepText.findComponent('element') as pc.ElementComponent;
        
        
        this.BlockNode.collision.enabled = false;
        this.BlockNode.enabled = false;

        this.gameData.step = Helper.GetRandomNumber(10, 10);
        // this.txtStep.text = "Step : " + this.gameData.step;

        this.nodePercent = new NodeData(this.nodeData.resource);
        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);;
    }

    postInitialize(){
        this.sharedUIMgr = this.UIMgrEntity.script?.get('uiMgr') as UIMgr;
        this.sharedUIMgr.showGameOver(false);

        this.randomInit();
    }
    
    update( dt: number){
        // Debug purpose to check data control
        //this.printDebug();
    }

    // reset the game status when needed
    reset(){
        this.addScore(-this.gameData.score, true);
        this.gameData.step = Helper.GetRandomNumber(10, 10);
        this.gameData.level = 1;
        this.gameData.UsedBlock = 0;
        this.txtStep.text = "Step : " + this.gameData.step;
        this.genNext();

        let x:number, y:number;
        for(x = 0; x < Core.MAX_BLOCK; ++x){
            for(y = 0; y < Core.MAX_BLOCK; ++y){
                this.ans[x][y].setVal(0, true);
            }
        }

        this.sharedUIMgr.showGameOver(false);
        this.randomInit();      
    }

    // get init board filled
    private randomInit(){
        let x:number, y:number;
        for(x = 0; x < Core.MAX_BLOCK; ++x){
            for(y = 0; y < Core.MAX_BLOCK; ++y){
                if(Math.random() > 0.6){
                    this.ans[x][y].setVal(this.getNewNodeValue(), true);
                    this.gameData.UsedBlock++;
                }
            }
        }

        this.processMarkedNode(this);
    }
    
    // get the mouse/touch to raycast the Gird for drop node
    onMouseDown(e : pc.MouseEvent) {

        let from:pc.Vec3 = this.entity.camera.screenToWorld(e.x, e.y, this.entity.camera.nearClip);
        let to:pc.Vec3 = this.entity.camera.screenToWorld(e.x, e.y, this.entity.camera.farClip);
        
        // TODO:// that the this.app.system cannot found rigidbody at Typescript but it work to added ignore at thie moment
        //@ts-ignore
        let result : pc.RaycastResult = this.app.systems.rigidbody.raycastFirst(from, to);

        if (result) {
            let pickedEntity:pc.Entity = result.entity;

            if(pickedEntity.script?.get('NodeObject')){
                let _nodeObj:NodeObject = <NodeObject> pickedEntity.script.get('NodeObject');

                
                this.BlockerEntity.enabled = true;
                if(this.dropNode(_nodeObj.gridX, this.gameData.nextVal)){
                    this.BlockNode.enabled = false;
                }else{
                    this.BlockerEntity.enabled = false;
                }
            }
        }
    };

    // debug purpose if needed to show on screen text
    printDebug() {
        let _txt:string = "";
        
        let i:number, j:number;
        for(j = 6; j >= 0; --j) {
            for(i = 0; i < Core.MAX_BLOCK; ++i){
                _txt = _txt + this.ans[i][j].Val + " ";
            }
            
            _txt = _txt + "\n";
        }
        
        this.txtDebug.text = _txt;

        let _maxBlock: number = Core.MAX_BLOCK * Core.MAX_BLOCK;
        this.txtDebug.text = this.gameData.UsedBlock + " / " + _maxBlock;
        
    };

    // next node show up 
    private genNext() {
        this.gameData.nextVal = this.getNewNodeValue();
        (this.BlockNode.script.get('NodeObject') as NodeObject).setVal(this.gameData.nextVal);
        
        this.BlockNode.enabled = true;
    };

    private getNewNodeValue() : number{
        let _p: number = Helper.GetRandomNumber(this.nodePercent.MaxPercent, 0);
        let _count: number = 0;

        let vi:number = 0;
        for(vi = 0; vi < this.nodePercent.NodePercent.length; ++vi){
            let _percent = this.nodePercent.NodePercent[vi];
            _count += _percent;
            if(_p <= _count){
                return vi+1;
            }
        }
        
        return 0;
    }

    // check need or not insert row and gameover if no space to add row
    // check the result of every step made, 0 - normal, 1 - created new row, -1 - game over
    private moreStep() : number{
        this.gameData.step--;
        let _res: number = 0;
        if(this.gameData.step <= 0){
            if(this.isFullFilled()){
                _res = -1;
            }else{
                this.gameData.level++;
                let _nextStep = Math.max(Helper.GetRandomNumber(10, 10) - this.gameData.level, 5);
                this.gameData.step = _nextStep;
                this.insertRow();
                _res = 1;
            }
        }else{
            if(this.gameData.UsedBlock == Core.MAX_BLOCK * Core.MAX_BLOCK){
                _res = -1;
            }
        }
        this.txtStep.text = "Step : " + this.gameData.step;
        return _res;
    }

    // shift up the node and insert at the bottom
    private insertRow() {
        let x:number, y:number;
        for(x = 0; x < Core.MAX_BLOCK; ++x){
            for(y = 5; y >= 0; --y){
                if(y == 0){
                    this.ans[x][y+1].setVal(this.ans[x][y].Val, true);
                    this.ans[x][y].setVal(Helper.GetRandomNumber(2, 8));
                    this.gameData.UsedBlock++;
                }else{
                    this.ans[x][y+1].setVal(this.ans[x][y].Val, true);
                }
            }
        }
    }

    // check full stacked node
    private isFullFilled() : boolean {
        let x : number;
        for(x = 0; x < Core.MAX_BLOCK; ++x){
            if(this.ans[x][6].Val != 0){
                return true;
            }
        }
        return false;
    }

    // drop the node at the specfic column
    private dropNode (x : number, num : number) : boolean {
        let i: number;
        let _tarNode:NodeObject;

        for(i = 0; i < Core.MAX_BLOCK; ++i){
            if(this.ans[x][i].Val == 0){
                //this.ans[x][i].setVal(num);
                this.gameData.UsedBlock++;

                _tarNode = this.ans[x][i];
                break;
            }
        }
        if(i == 7){return false;}
        
        // wait for scan puzzle need to solve, should be animation here
        //setTimeout(this.scanPuzzleNeedToSolve, 250, this);
        this.addDummyDropAnime(x, num, _tarNode);
        return true;
    };

    private addDummyDropAnime(x:number, num:number, targetNode:NodeObject){
        let _pos:pc.Vec3 = this.ans[x][6].entity.getPosition();
        _pos.y += 0.5;

        let _dummy:pc.Entity = this.BlockNode.clone();
        this.BlockNode.parent.addChild(_dummy);
        _dummy.setPosition(_pos);
        
        let _yDiff:number =  targetNode.entity.getPosition().y - _pos.y;
        let _yDur:number = Math.abs((_yDiff/2.5) * 0.2);

        let _nodeScript:NodeObject = <NodeObject>_dummy.script.get('NodeObject');
        _nodeScript.MoveTo(new pc.Vec2(0, _yDiff), _yDur, (node:NodeObject)=>{
            node.entity.destroy();
            targetNode.setVal(num);

            this.scanPuzzleNeedToSolve(this);
        });
    }

    // scan puzzle and remark any solve needed
    private scanPuzzleNeedToSolve(_core : Core){
        let _x : number, _y : number;
        for(_x = 0; _x < Core.MAX_BLOCK; ++_x){
            _core.checkVert(_x);
        }
        for(_y = 0; _y < Core.MAX_BLOCK; ++_y){
            _core.checkHori(_y);
        }

        // should be animation play when found detected node to solve
        setTimeout(_core.processMarkedNode, 300, _core);
    }

    // remove and sort the empty space out
    private processMarkedNode(_core : Core){
        let _pClean : boolean =_core.CheckAndCleanMarked();
        let _pSort : boolean = _core.sortBlock();
        if(_pClean || _pSort){
            // if any change made on the board have to scan puzzle again until nothing change, and score got multiply
            _core.gameData.multiply+=4;
            setTimeout(_core.scanPuzzleNeedToSolve, 200, _core);
        }else{
            let _gameStatus : number = _core.moreStep();
            if(!_gameStatus){
                // happen nothing if the step is not yet need to insert row
                _core.gameData.multiply = 1;
                _core.BlockerEntity.enabled = false;
                _core.genNext();

                if(!_core.gameData.isStarted){ _core.gameData.isStarted = true; }
            }else if(_gameStatus == 1){
                // insert row at the bottom and scan puzzle again
                _core.scanPuzzleNeedToSolve(_core);
            }else{
                // no more row can insert or full board dropped make the game over
                _core.gameData.isStarted = false;
                _core.sharedUIMgr.showGameOver(true);
                //Game Over
            }
        }
    }

    // remove the block is matched the logics and break nearly by in cross
    private removeBlock(x : number, y : number) {
        this.ans[x][y].setVal(0);
        this.gameData.UsedBlock--;
        
        let _close :number = 0;
        while(_close < 4){
            let _nextNode:NodeObject = null;
            switch(_close){
                case 0:
                    if(x - 1 >= 0){
                        _nextNode = this.ans[x-1][y];
                    }
                    break;
                case 1:
                    if(x + 1 < Core.MAX_BLOCK){
                        _nextNode = this.ans[x+1][y];
                    }
                    break;
                case 2:
                    if( y - 1 >= 0){
                        _nextNode = this.ans[x][y-1];
                    }
                    break;
                case 3:
                    if( y + 1 < Core.MAX_BLOCK ){
                        _nextNode = this.ans[x][y+1];
                    }
                    break;
            }
            if(_nextNode != null && _nextNode.Val > 100){
                _nextNode.setVal(0);
            }
            _close++;
        }

        this.addScore(this.gameData.multiply * this.gameData.baseScore);
    };

    private addScore(val : number , force : boolean = false){
        if(this.gameData.isStarted || force){
            this.gameData.score += val;
            this.txtScore.text = "Score : " + this.gameData.score;
        }
    }

    // sort down to fill the empty space
    private sortBlock() {
        let _sorted :boolean = false;
        let i, j;
        for(j = 0; j < Core.MAX_BLOCK; ++j) {
            let _empty :number = -1;
            for(i = 0; i < Core.MAX_BLOCK; ++i){
                if(this.ans[j][i].Val > 0 && _empty != -1){
                    this.ans[j][_empty].setVal(this.ans[j][i].Val);
                    this.ans[j][i].setVal(0, true);
                    
                    _empty++;
                    
                    _sorted = true;
                }
                
                if(this.ans[j][i].Val == 0 && _empty == -1){
                    _empty = i;
                }
                
            }
            
        }
        return _sorted;
    };

    // check column if any matched node will marked
    private checkVert(x : number) {
        let y :number;
        let _max :number = 0;
        for(y = 6; y>=0; --y){
            if(this.ans[x][y].Val > 0 && _max == 0){
                _max = y + 1;
            }
            
            if(this.ans[x][y].Val != 0 && this.ans[x][y].Val == _max){
                this.ans[x][y].setMarked(true);
            }

        }
        
    };

    // check row if any matched node will marked
    private checkHori(y : number){
        let x : number;
        let _max : number = 0;
        for(x = 0; x <= Core.MAX_BLOCK; ++x){
            if( x == Core.MAX_BLOCK || this.ans[x][y].Val == 0){
                if(_max > 0){
                    let _chk:number = _max;
                    while(_chk > 0){
                        let sx:number = x - _chk;
                        if(this.ans[sx][y].Val == _max){
                            this.ans[sx][y].setMarked(true);
                        }
                        _chk--;
                    }

                    _max = 0;
                }
            }else{
                _max++;
            }
            
        }
    };

    // handle all the node that marked as matched node to remove
    CheckAndCleanMarked() {
        let _act : boolean = false;
        let x : number, y : number;
        for(x = 0; x < Core.MAX_BLOCK; ++x){
            for (y = 0; y < Core.MAX_BLOCK; ++y){
                if(this.ans[x][y].Marked){
                    this.removeBlock(x, y);
                    this.ans[x][y].setMarked(false);
                    _act = true;
                }
            }
        }
        return _act;
    };
}