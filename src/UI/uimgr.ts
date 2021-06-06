import { ContactResult, ElementTouchEvent, Entity } from "playcanvas";
import { createScript, ScriptTypeBase, attrib } from "../../lib/create-script-decorator";
import { Core } from "../core";

@createScript("uiMgr")
export class UIMgr extends ScriptTypeBase  {

    @attrib({type: 'entity'}) UIGameOverEntity : pc.Entity;
    @attrib({type: 'entity'}) RestartButton : pc.Entity;
    @attrib({type: 'string'}) NextScene : string;

    initialize(){
        
        this.RestartButton.element.on('mousedown', this.btnRestartClicked, this);
        this.RestartButton.element.on('touchend', this.btnRestartTouched, this);
    }

    showGameOver(show : boolean){
        this.UIGameOverEntity.enabled = show;
    }

    restartScene(){
        Core.SharedInc.reset();
    }

    btnRestartClicked(e : MouseEvent){
        this.restartScene();
    }
    btnRestartTouched(e : ElementTouchEvent){
        this.restartScene();
    }

}

