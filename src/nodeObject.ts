import { Color, Entity, StandardMaterial } from "playcanvas";
import { createScript, ScriptTypeBase, attrib } from "../lib/create-script-decorator";
import { Helper } from "./helper/helper";

@createScript("nodeObject")
export class NodeObject extends ScriptTypeBase  {

    @attrib({type:'asset', assetType:'texture', array: true}) texs : pc.Asset[];
    @attrib({type:'entity'}) ImgHolder : pc.Entity;
    
    public gridX: number = 0;
    public gridY : number = 0;

    public Marked : boolean = false;
    
    public setMarked(_val: boolean){
        this.Marked = _val;
        if(this.Marked){
            this.setColor(0.93, 0.44, 0.44);
        }else{
            this.setColor(1, 1, 1);
        }
    }


    Val : number = 0;
   
    private _spr : pc.ElementComponent = null;
    private _board : pc.ElementComponent = null;

    initialize(){
       this._spr = (this.entity.findByName('img') as Entity).element;
       this._board = (this.entity.findByName('eff') as Entity).element;
    }

    setVal( val : number , force : boolean = false) {
        if(val == 8) { val = 100 +  Helper.GetRandomNumber(7, 1); }
        else if(val == 9) { val = 200 + Helper.GetRandomNumber(7, 1); }

        if(!force && (this.Val > 100 && val == 0)){
            this.Val -= 100;
        }else{
            this.Val = val;
        }

        let _texIn = 0;
        if(this.Val > 200){_texIn = 8;}
        else if(this.Val > 100) {_texIn = 7;}
        else if(this.Val != 0){
            _texIn = this.Val - 1;
        }

        if(this.Val != 0){
                this.ImgHolder.element.textureAsset = this.texs[_texIn].id;
        }else{
            this.ImgHolder.element.textureAsset = 0;
        }
    }

    setColor( r :number, g : number, b:number, a:number = 1){
        this._board.color = new Color(r, g, b);
    }

}