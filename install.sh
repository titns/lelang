```bash

# ROCM https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/wsl/install-pytorch.html
# KOKORO https://github.com/hexgrad/kokoro

#install AM Drivers
wget https://repo.radeon.com/amdgpu-install/6.3.4/ubuntu/noble/amdgpu-install_6.3.60304-1_all.deb
sudo apt install ./amdgpu-install_6.3.60304-1_all.deb
amdgpu-install -y --usecase=wsl,rocm --no-dkms
rocminfo

#install miniconda
mkdir -p ~/miniconda3
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
rm ~/miniconda3/miniconda.sh

# Create a python 3.12 virtual environment, you can also use virtualenv
source ~/miniconda/bin/activate
conda create -n lelang python=3.12
conda activate lelang

#install rocmtorch
python 3.12
sudo apt install python3-pip -y
pip3 install --break-system-packages --upgrade pip wheel

wget https://repo.radeon.com/rocm/manylinux/rocm-rel-6.3.4/torch-2.4.0%2Brocm6.3.4.git7cecbf6d-cp312-cp312-linux_x86_64.whl
wget https://repo.radeon.com/rocm/manylinux/rocm-rel-6.3.4/torchvision-0.19.0%2Brocm6.3.4.gitfab84886-cp312-cp312-linux_x86_64.whl
wget https://repo.radeon.com/rocm/manylinux/rocm-rel-6.3.4/pytorch_triton_rocm-3.0.0%2Brocm6.3.4.git75cc27c2-cp312-cp312-linux_x86_64.whl
wget https://repo.radeon.com/rocm/manylinux/rocm-rel-6.3.4/torchaudio-2.4.0%2Brocm6.3.4.git69d40773-cp312-cp312-linux_x86_64.whl

pip3 uninstall --break-system-packages torch torchvision pytorch-triton-rocm
pip3 install  --break-system-packages torch-2.4.0+rocm6.3.4.git7cecbf6d-cp312-cp312-linux_x86_64.whl torchvision-0.19.0+rocm6.3.4.gitfab84886-cp312-cp312-linux_x86_64.whl torchaudio-2.4.0+rocm6.3.4.git69d40773-cp312-cp312-linux_x86_64.whl pytorch_triton_rocm-3.0.0+rocm6.3.4.git75cc27c2-cp312-cp312-linux_x86_64.whl

#fix torch reference
location=$(pip show torch | grep Location | awk -F ": " '{print $2}')
cd ${location}/torch/lib/
rm libhsa-runtime64.so*

#fix gcc error
conda install -c conda-forge gcc=12.1.0

#install kokoro dependencies
pip install kokoro IPython soundfile
sudo apt install espeak
#install flask server
pip install Flask flask-cors


